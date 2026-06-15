#!/usr/bin/env node
/**
 * GoTogether Daily Promoter Agent.
 *
 * Finds a card happening TOMORROW that still has open spots, lets Claude pick the
 * most compelling one, write a short Hebrew promo article, and email it out.
 *
 * The "agentic" part is the tool-use loop: Claude is given two tools
 * (get_candidate_cards, send_promo_email) and decides which card to promote, what
 * to write, and when to send. Our code just executes the tool calls and loops
 * until Claude ends its turn.
 *
 * Run:  pnpm agent
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Load .env.local (same approach as scripts/qa-check.mjs) ─────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      if (!line || line.trimStart().startsWith('#')) continue
      const [key, ...rest] = line.split('=')
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
    }
  } catch {}
}
loadEnv()

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY,
  RESEND_API_KEY,
  QA_EMAIL,
} = process.env

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY,
  RESEND_API_KEY,
  QA_EMAIL,
})) {
  if (!val) {
    console.error(`[agent] Missing ${name} in .env.local — aborting.`)
    process.exit(1)
  }
}

// Service-role client — bypasses RLS and can read auth.users emails. Server-only.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

const FROM = 'GoTogether <onboarding@resend.dev>'

// ─── Step 1: gather candidates (plain code, not the model) ───────────────────
// Cards happening tomorrow that still have open spots. Spots-remaining mirrors
// mapCard() in src/lib/cards.ts: currentParticipants = participants.length.
async function getCandidateCards() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const iso = tomorrow.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('travel_cards')
    .select('id, title, description, type, city, country, tags, event_date, event_time, max_participants, participants(id, user_id)')
    .eq('event_date', iso)

  if (error) throw new Error(`Supabase query failed: ${error.message}`)

  return (data || [])
    .map((c) => {
      const joined = (c.participants || []).length
      return {
        cardId: c.id,
        title: c.title,
        description: c.description,
        type: c.type,
        city: c.city,
        country: c.country,
        tags: c.tags || [],
        eventDate: c.event_date,
        eventTime: c.event_time,
        spotsLeft: c.max_participants - joined,
        participantUserIds: (c.participants || []).map((p) => p.user_id),
      }
    })
    .filter((c) => c.spotsLeft > 0)
}

// ─── Recipients ──────────────────────────────────────────────────────────────
// Demo default: email only yourself. Flip DEMO_MODE to false to email real users
// (everyone who hasn't already joined that card).
const DEMO_MODE = true

async function getRecipients(card) {
  if (DEMO_MODE) return [QA_EMAIL]

  // Real version: all registered users who haven't joined this card.
  const joined = new Set(card.participantUserIds)
  const recipients = []
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    for (const u of data.users) {
      if (u.email && !joined.has(u.id)) recipients.push(u.email)
    }
    if (data.users.length < 1000) break
    page++
  }
  return recipients
}

// ─── Resend send (same shape as scripts/qa-check.mjs) ────────────────────────
async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body}`)
  }
  return res.json()
}

// ─── Tools exposed to the agent ──────────────────────────────────────────────
const tools = [
  {
    name: 'get_candidate_cards',
    description:
      'Return the list of GoTogether cards happening tomorrow that still have open spots. Call this first to see what is available.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'send_promo_email',
    description:
      'Send the promo article by email. Call this exactly once, after choosing the best card and writing the article.',
    input_schema: {
      type: 'object',
      properties: {
        cardId: { type: 'string', description: 'The id of the card being promoted.' },
        subject: { type: 'string', description: 'Email subject line (Hebrew).' },
        articleHtml: { type: 'string', description: 'The promo article as HTML (Hebrew, RTL).' },
      },
      required: ['cardId', 'subject', 'articleHtml'],
    },
  },
]

// Cache candidates so both the tool and the email handler use the same data.
let candidatesCache = null

async function runTool(name, input) {
  if (name === 'get_candidate_cards') {
    candidatesCache = await getCandidateCards()
    console.log(`[agent] get_candidate_cards -> ${candidatesCache.length} card(s)`)
    // Strip internal-only fields before showing the model.
    return candidatesCache.map(({ participantUserIds, ...rest }) => rest)
  }

  if (name === 'send_promo_email') {
    const card = (candidatesCache || []).find((c) => c.cardId === input.cardId)
    if (!card) return { ok: false, error: `Unknown cardId ${input.cardId}` }
    const recipients = await getRecipients(card)
    if (recipients.length === 0) return { ok: false, error: 'No recipients.' }

    const wrapped = `<div dir="rtl" style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto;line-height:1.6">${input.articleHtml}</div>`
    await sendEmail(recipients, input.subject, wrapped)
    console.log(`[agent] send_promo_email -> "${input.subject}" to ${recipients.length} recipient(s)`)
    return { ok: true, sentTo: recipients.length, cardId: input.cardId }
  }

  return { ok: false, error: `Unknown tool ${name}` }
}

// ─── The agent loop ──────────────────────────────────────────────────────────
const SYSTEM = `You are GoTogether's daily promoter agent. GoTogether is a Hebrew, RTL app for joining group trips and activities in Israel.
Your job: call get_candidate_cards, pick the single most compelling card that still needs people, write a short warm promo article in Hebrew (~120 words) as simple HTML (a heading + 1-2 paragraphs + a closing line that invites joining), then call send_promo_email exactly once with that card's id.
If get_candidate_cards returns an empty list, do not send anything — just say there is nothing to promote today.`

async function main() {
  console.log('[agent] starting daily promoter run...')
  const messages = [
    { role: 'user', content: 'Run today\'s promotion. Find tomorrow\'s best card that needs people and promote it.' },
  ]

  for (let turn = 0; turn < 8; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: SYSTEM,
      tools,
      messages,
    })

    // Echo any text the model produced this turn.
    for (const block of response.content) {
      if (block.type === 'text' && block.text.trim()) console.log(`[agent:claude] ${block.text.trim()}`)
    }

    if (response.stop_reason !== 'tool_use') {
      console.log('[agent] done.')
      return
    }

    // Append the assistant turn, then run each tool and return results.
    messages.push({ role: 'assistant', content: response.content })
    const toolResults = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      let result
      try {
        result = await runTool(block.name, block.input)
      } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  console.log('[agent] stopped: hit max turns without finishing.')
}

main().catch((e) => {
  console.error('[agent] error:', e instanceof Error ? e.message : e)
  process.exit(1)
})
