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
// Public base URL of the deployed app (Vercel). Card links point here.
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')

const TYPE_LABEL = {
  trip: 'טיול', attraction: 'אטרקציה', workshop: 'סדנה',
  sport: 'ספורט', food: 'אוכל', other: 'אירוע',
}

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Branded HTML email. `bodyHtml` is the model-written article copy.
function buildEmailHtml(card, bodyHtml) {
  const url = `${APP_URL}/he/cards/${card.cardId}`
  const dateLabel = new Date(card.eventDate).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const chips = [
    `📍 ${esc(card.city)}`,
    `🗓️ ${esc(dateLabel)}${card.eventTime ? ` · ${esc(card.eventTime)}` : ''}`,
    `🏷️ ${esc(TYPE_LABEL[card.type] || card.type)}`,
    `🔥 ${card.spotsLeft} מקומות נותרו`,
  ].map(
    (c) =>
      `<span style="display:inline-block;background:#f1f5f9;color:#0f172a;border-radius:999px;padding:6px 12px;margin:3px 2px;font-size:13px;font-weight:600">${c}</span>`,
  ).join('')

  const hero = card.image
    ? `<img src="${esc(card.image)}" alt="${esc(card.title)}" width="600" style="display:block;width:100%;max-width:600px;height:240px;object-fit:cover" />`
    : ''

  return `<!doctype html><html dir="rtl" lang="he"><body style="margin:0;background:#0a1620;padding:24px 0;font-family:system-ui,'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    <tr><td style="background:linear-gradient(120deg,#06b6d4,#8b5cf6);padding:20px 28px">
      <div style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px;opacity:.9">GoTogether · קורה מחר</div>
      <div style="color:#fff;font-size:26px;font-weight:800;margin-top:4px">${esc(card.title)}</div>
    </td></tr>
    ${hero ? `<tr><td>${hero}</td></tr>` : ''}
    <tr><td style="padding:20px 28px 8px">${chips}</td></tr>
    <tr><td style="padding:4px 28px 8px;color:#334155;font-size:16px;line-height:1.7">${bodyHtml}</td></tr>
    <tr><td align="center" style="padding:16px 28px 28px">
      <a href="${url}" style="display:inline-block;background:linear-gradient(120deg,#06b6d4,#8b5cf6);color:#fff;text-decoration:none;font-size:17px;font-weight:800;padding:14px 38px;border-radius:999px">להצטרפות לכרטיסייה »</a>
      <div style="margin-top:12px"><a href="${url}" style="color:#06b6d4;font-size:13px;text-decoration:none">${esc(url)}</a></div>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:16px 28px;color:#94a3b8;font-size:12px;text-align:center">GoTogether — מוצאים אנשים, יוצאים יחד 🌊</td></tr>
  </table></td></tr></table></body></html>`
}

// ─── Step 1: gather candidates (plain code, not the model) ───────────────────
// Cards happening tomorrow that still have open spots. Spots-remaining mirrors
// mapCard() in src/lib/cards.ts: currentParticipants = participants.length.
async function getCandidateCards() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const iso = tomorrow.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('travel_cards')
    .select('id, title, description, type, city, country, tags, event_date, event_time, max_participants, card_images(url, position), participants(id, user_id)')
    .eq('event_date', iso)

  if (error) throw new Error(`Supabase query failed: ${error.message}`)

  return (data || [])
    .map((c) => {
      const joined = (c.participants || []).length
      const firstImage = (c.card_images || []).slice().sort((a, b) => a.position - b.position)[0]?.url || null
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
        image: firstImage,
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
        subject: { type: 'string', description: 'Email subject line (Hebrew), may include one emoji.' },
        articleHtml: { type: 'string', description: 'The promo article BODY only (Hebrew, RTL) as 1-2 short <p> paragraphs. Do NOT include images, headings, buttons, or links — the template adds those.' },
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

    const html = buildEmailHtml(card, input.articleHtml)
    await sendEmail(recipients, input.subject, html)
    console.log(`[agent] send_promo_email -> "${input.subject}" to ${recipients.length} recipient(s)`)
    return { ok: true, sentTo: recipients.length, cardId: input.cardId }
  }

  return { ok: false, error: `Unknown tool ${name}` }
}

// ─── The agent loop ──────────────────────────────────────────────────────────
const SYSTEM = `You are GoTogether's daily promoter agent. GoTogether is a Hebrew, RTL app for joining group trips and activities in Israel.
Your job: call get_candidate_cards, pick the single most compelling card that still needs people, write a short warm promo article BODY in Hebrew (~80 words) as 1-2 <p> paragraphs only — no heading, image, button, or link (the email template adds the title, photo, details, and a join button). End with a sentence that invites joining. Then call send_promo_email exactly once with that card's id.
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
