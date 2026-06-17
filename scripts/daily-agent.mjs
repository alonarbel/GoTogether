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
import nodemailer from 'nodemailer'
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
  QA_EMAIL,
  RESEND_API_KEY,
  GMAIL_APP_PASSWORD,
} = process.env
const GMAIL_USER = process.env.GMAIL_USER || QA_EMAIL
// Use Gmail SMTP when an app password is set (delivers to anyone); else Resend.
const USE_GMAIL = Boolean(GMAIL_APP_PASSWORD)

for (const [name, val] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY,
  QA_EMAIL,
  // Need a Gmail app password OR a Resend key to send.
  EMAIL_TRANSPORT: GMAIL_APP_PASSWORD || RESEND_API_KEY,
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

const FROM = USE_GMAIL
  ? `GoTogether <${GMAIL_USER}>`
  : process.env.MAIL_FROM || 'GoTogether <onboarding@resend.dev>'
const gmailTransport = USE_GMAIL
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
  : null
// Public base URL of the deployed app (Vercel). Card links point here.
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')

const TYPE_LABEL = {
  trip: 'Trip', attraction: 'Attraction', workshop: 'Workshop',
  sport: 'Sport', food: 'Food', other: 'Event',
}

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Known-good Unsplash photos per card type. Email clients can't run an onError
// fallback (JS is stripped), so the hero URL must be valid up front. Used when a
// card has no image of its own.
const FALLBACK_IMG = {
  trip: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
  attraction: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  workshop: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80',
  sport: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  other: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
}
const heroUrl = (card) =>
  card.image || FALLBACK_IMG[card.type] || FALLBACK_IMG.other

// Branded HTML email — modern, mobile-friendly, email-client-safe (tables +
// inline styles, no JS, bulletproof CTA). `bodyHtml` is the model-written copy.
function buildEmailHtml(card, bodyHtml) {
  const url = `${APP_URL}/en/cards/${card.cardId}`
  const dateLabel = new Date(card.eventDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const typeLabel = esc(TYPE_LABEL[card.type] || card.type)
  const max = card.maxParticipants || (card.joined + card.spotsLeft) || 0
  const pct = max > 0 ? Math.min(100, Math.round((card.joined / max) * 100)) : 0
  const almostFull = card.spotsLeft <= 3
  const urgency = almostFull ? `Only ${card.spotsLeft} spots left` : `${card.spotsLeft} spots left`

  // One detail row: icon + label + value.
  const row = (icon, value) => `
    <tr>
      <td width="34" style="padding:7px 0;font-size:18px;vertical-align:middle">${icon}</td>
      <td style="padding:7px 0;font-size:15px;color:#0f172a;font-weight:600;vertical-align:middle">${value}</td>
    </tr>`

  const detailRows =
    row('🗓️', `${esc(dateLabel)}${card.eventTime ? ` &middot; ${esc(card.eventTime)}` : ''}`) +
    row('📍', `${esc(card.city)}${card.country ? `, ${esc(card.country)}` : ''}`) +
    row('🏷️', typeLabel)

  // Spots progress bar (table-based so Outlook renders it).
  const progress = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
      <tr><td style="font-size:13px;color:#64748b;padding-bottom:6px">
        <strong style="color:#0f172a">${card.joined}</strong> joined &middot; <strong style="color:${almostFull ? '#e11d48' : '#0891b2'}">${urgency}</strong>
      </td></tr>
      <tr><td style="background:#e2e8f0;border-radius:999px;font-size:0;line-height:0">
        <table role="presentation" width="${pct}%" cellpadding="0" cellspacing="0"><tr>
          <td height="8" style="background:linear-gradient(90deg,#06b6d4,#8b5cf6);background-color:#06b6d4;border-radius:999px;height:8px;line-height:8px;font-size:0">&nbsp;</td>
        </tr></table>
      </td></tr>
    </table>`

  // Bulletproof CTA button (works in Outlook via VML-free padded link in a table).
  const cta = `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
      <td align="center" bgcolor="#0891b2" style="border-radius:999px;background:linear-gradient(120deg,#06b6d4,#8b5cf6)">
        <a href="${url}" style="display:inline-block;padding:15px 44px;font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px">Join this event &rarr;</a>
      </td>
    </tr></table>`

  const hero = `<img src="${esc(heroUrl(card))}" alt="${esc(card.title)}" width="600" style="display:block;width:100%;max-width:600px;height:260px;object-fit:cover;border:0" />`

  // Hidden preheader (inbox preview text).
  const preheader = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${urgency} — ${esc(card.title)} on ${esc(dateLabel)}.</div>`

  return `<!doctype html><html dir="ltr" lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#0a1620">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1620;padding:28px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

      <!-- brand bar -->
      <tr><td style="padding:0 4px 14px">
        <span style="color:#7dd3fc;font-size:15px;font-weight:800;letter-spacing:.4px">Go<span style="color:#c4b5fd">Together</span></span>
        <span style="float:right;color:#64748b;font-size:12px;font-weight:600">COMING UP</span>
      </td></tr>

      <!-- card -->
      <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

          <tr><td style="position:relative">${hero}</td></tr>

          <tr><td style="padding:24px 30px 4px">
            <div style="display:inline-block;background:#ecfeff;color:#0891b2;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:5px 12px;border-radius:999px">${typeLabel}</div>
            <h1 style="margin:12px 0 4px;font-size:25px;line-height:1.25;color:#0f172a;font-weight:800">${esc(card.title)}</h1>
          </td></tr>

          <tr><td style="padding:8px 30px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table>
          </td></tr>

          <tr><td style="padding:10px 30px 0">${progress}</td></tr>

          <tr><td style="padding:14px 30px 4px;color:#475569;font-size:16px;line-height:1.7">${bodyHtml}</td></tr>

          <tr><td style="padding:22px 30px 6px">${cta}</td></tr>
          <tr><td align="center" style="padding:0 30px 26px">
            <a href="${url}" style="color:#94a3b8;font-size:12px;text-decoration:none">${esc(url)}</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- footer -->
      <tr><td style="padding:18px 8px;text-align:center;color:#64748b;font-size:12px;line-height:1.6">
        GoTogether — find people, go together 🌊<br>
        You're getting this because you joined the GoTogether community.
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}

// ─── Step 1: gather candidates (plain code, not the model) ───────────────────
// Upcoming cards (today onward) with open spots. We then keep only the soonest
// date that has any — tomorrow if it has cards, otherwise the closest event.
// Spots-remaining mirrors mapCard() in src/lib/cards.ts (participants.length).
async function getCandidateCards() {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const { data, error } = await supabase
    .from('travel_cards')
    .select('id, title, description, type, city, country, tags, event_date, event_time, max_participants, card_images(url, position), participants(id, user_id)')
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  if (error) throw new Error(`Supabase query failed: ${error.message}`)

  const withSpots = (data || [])
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
        maxParticipants: c.max_participants,
        joined,
        image: firstImage,
        participantUserIds: (c.participants || []).map((p) => p.user_id),
      }
    })
    .filter((c) => c.spotsLeft > 0)

  if (withSpots.length === 0) return []

  // Keep only the soonest date that has cards (tomorrow if present, else closest).
  const soonest = withSpots[0].eventDate // sorted ascending by event_date
  return withSpots.filter((c) => c.eventDate === soonest)
}

// ─── Recipients ──────────────────────────────────────────────────────────────
// Demo default: email only yourself. Flip DEMO_MODE to false to email real users
// (everyone who hasn't already joined that card).
const DEMO_MODE = true
// Extra demo recipients (comma-separated) on top of QA_EMAIL.
const EXTRA_RECIPIENTS = (process.env.EXTRA_RECIPIENTS || '')
  .split(',').map((s) => s.trim()).filter(Boolean)

async function getRecipients(card) {
  if (DEMO_MODE) return [...new Set([QA_EMAIL, ...EXTRA_RECIPIENTS])]

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

// ─── Send one email. Gmail SMTP (delivers to anyone) when an app password is
// set, otherwise Resend (sandbox: only your own verified address). One call per
// recipient so one bad address doesn't block the rest. ───────────────────────
async function sendEmail(to, subject, html) {
  if (USE_GMAIL) {
    const info = await gmailTransport.sendMail({ from: FROM, to, subject, html })
    return { id: info.messageId }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Tools exposed to the agent ──────────────────────────────────────────────
const tools = [
  {
    name: 'get_candidate_cards',
    description:
      'Return the list of upcoming GoTogether cards that still have open spots — the soonest date available (tomorrow if there is one, otherwise the closest upcoming event). Call this first.',
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
        subject: { type: 'string', description: 'Email subject line (English), may include one emoji.' },
        articleHtml: { type: 'string', description: 'The promo article BODY only (English) as 1-2 short <p> paragraphs. Do NOT include images, headings, buttons, or links — the template adds those.' },
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
    const sent = []
    const failed = []
    for (const to of recipients) {
      try {
        await sendEmail(to, input.subject, html)
        sent.push(to)
      } catch (e) {
        failed.push({ to, error: e instanceof Error ? e.message : String(e) })
        console.warn(`[agent] send failed for ${to}: ${e instanceof Error ? e.message : e}`)
      }
    }
    console.log(`[agent] send_promo_email -> "${input.subject}" | sent ${sent.length}, failed ${failed.length}`)
    return { ok: sent.length > 0, sentTo: sent, failed, cardId: input.cardId }
  }

  return { ok: false, error: `Unknown tool ${name}` }
}

// ─── The agent loop ──────────────────────────────────────────────────────────
const SYSTEM = `You are GoTogether's daily promoter agent. GoTogether is an app for joining group trips and activities.
Your job: call get_candidate_cards (it returns the soonest upcoming events with open spots), pick the single most compelling card that still needs people, write a short warm promo article BODY in English (~80 words) as 1-2 <p> paragraphs only — no heading, image, button, or link (the email template adds the title, photo, details, and a join button). End with a sentence that invites joining. Then call send_promo_email exactly once with that card's id.
If get_candidate_cards returns an empty list, do not send anything — just say there is nothing to promote.`

async function main() {
  console.log('[agent] starting daily promoter run...')
  const messages = [
    { role: 'user', content: 'Run today\'s promotion. Find the soonest upcoming card that needs people and promote it.' },
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
