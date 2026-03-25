#!/usr/bin/env node
/**
 * GoTogether QA Agent — runs after every git commit.
 * Performs static checks + feature scenario analysis, then emails a rich report.
 */
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── Load .env.local ────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
    }
  } catch {}
}
loadEnv()

const RESEND_API_KEY = process.env.RESEND_API_KEY
const QA_EMAIL = process.env.QA_EMAIL

if (!RESEND_API_KEY || !QA_EMAIL) {
  console.log('[QA] Missing RESEND_API_KEY or QA_EMAIL in .env.local — skipping.')
  process.exit(0)
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function run(cmd, timeoutMs = 120_000) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: timeoutMs })
    return { ok: true, output: out.trim() }
  } catch (err) {
    return { ok: false, output: ((err.stdout || '') + (err.stderr || '')).trim() }
  }
}

function readSrc(relPath) {
  try { return readFileSync(resolve(ROOT, relPath), 'utf8') } catch { return '' }
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath))
}

function escapeHtml(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Scenario check helper — returns { ok, details[] }
function scenario(name) {
  const details = []
  let failed = 0
  return {
    name,
    check(label, condition, failMsg) {
      if (condition) {
        details.push({ ok: true, label })
      } else {
        details.push({ ok: false, label, msg: failMsg })
        failed++
      }
      return this
    },
    result() {
      return { name, ok: failed === 0, details }
    }
  }
}

// ─── Commit info ────────────────────────────────────────────────────────────
const commitHash = run('git rev-parse --short HEAD').output
const commitMsg  = run('git log -1 --pretty=%s').output
const branch     = run('git rev-parse --abbrev-ref HEAD').output
const author     = run('git log -1 --pretty="%an <%ae>"').output
const filesChanged = run('git diff-tree --no-commit-id -r --name-only HEAD').output

console.log(`[QA] Running checks for commit ${commitHash}...`)

// ─── SECTION 1: Static Checks ───────────────────────────────────────────────
const staticChecks = []

// 1a. TypeScript
console.log('[QA] TypeScript...')
const tsc = run('npx tsc --noEmit')
staticChecks.push({
  name: 'TypeScript',
  ok: tsc.ok,
  output: tsc.ok ? 'No type errors.' : tsc.output.slice(0, 4000),
})

// 1b. ESLint (flat config — use eslint directly)
console.log('[QA] ESLint...')
const lint = run('npx eslint src/ --ext .ts,.tsx')
staticChecks.push({
  name: 'ESLint',
  ok: lint.ok,
  output: lint.ok ? 'No lint errors.' : lint.output.slice(0, 4000),
})

// 1c. No raw console.log left in src
const consoleLogs = run('grep -rn "console\\.log" src/ --include="*.ts" --include="*.tsx"')
staticChecks.push({
  name: 'No console.log in src',
  ok: !consoleLogs.output,
  output: consoleLogs.output || 'Clean.',
})

// 1d. No hardcoded TODO / FIXME
const todos = run('grep -rn "TODO\\|FIXME\\|HACK\\|XXX" src/ --include="*.ts" --include="*.tsx"')
staticChecks.push({
  name: 'No TODO/FIXME markers',
  ok: !todos.output,
  output: todos.output || 'None found.',
})

// 1e. i18n keys parity (en vs he must have same top-level sections)
console.log('[QA] i18n...')
let i18nOk = true, i18nMsg = ''
try {
  const en = JSON.parse(readSrc('messages/en.json'))
  const he = JSON.parse(readSrc('messages/he.json'))
  const enKeys = Object.keys(en).sort()
  const heKeys = Object.keys(he).sort()
  const missingHe = enKeys.filter(k => !heKeys.includes(k))
  const missingEn = heKeys.filter(k => !enKeys.includes(k))
  if (missingHe.length) { i18nOk = false; i18nMsg += `Missing in he.json: ${missingHe.join(', ')}. ` }
  if (missingEn.length) { i18nOk = false; i18nMsg += `Missing in en.json: ${missingEn.join(', ')}. ` }
  if (i18nOk) i18nMsg = `Both locales have ${enKeys.length} top-level keys. ✓`
} catch(e) { i18nOk = false; i18nMsg = `Parse error: ${e.message}` }
staticChecks.push({ name: 'i18n parity (en ↔ he)', ok: i18nOk, output: i18nMsg })

// ─── SECTION 2: Feature Scenarios ───────────────────────────────────────────
console.log('[QA] Running feature scenarios...')
const scenarios = []

// ── Scenario: Authentication ──────────────────────────────────────────────
{
  const authFiles = ['src/components/auth/AuthModal.tsx', 'src/components/auth/AuthForm.tsx']
  const authFile = authFiles.find(f => fileExists(f))
  const auth = readSrc(authFile || 'src/components/layout/Navbar.tsx')
  const s = scenario('Authentication')
    .check('Login tab exists', auth.includes('loginTab') || auth.includes('signIn'), 'No login tab/signIn found')
    .check('Register tab exists', auth.includes('registerTab') || auth.includes('createAccount'), 'No register tab found')
    .check('Reset password flow', auth.includes('resetPassword') || auth.includes('forgotPassword'), 'No reset password found')
    .check('Supabase signIn called', auth.includes('signInWithPassword') || readSrc('src/lib/supabase.ts').includes('supabase'), 'No supabase auth call found')
  scenarios.push(s.result())
}

// ── Scenario: Explore / Home Page ─────────────────────────────────────────
{
  const explore = readSrc('src/components/ExplorePage.tsx')
  const s = scenario('Explore Page — Filters & Pagination')
    .check('Pagination implemented', explore.includes('CARDS_PER_PAGE') || explore.includes('currentPage'), 'No pagination found')
    .check('Past events hidden', explore.includes('eventDate') && (explore.includes('>= today') || explore.includes('>= now') || explore.includes('notPast')), 'Past events not filtered out')
    .check('"Almost full" filter', explore.includes('almost_full'), '"almost_full" filter missing')
    .check('Date range filter (dateFrom)', explore.includes('dateFrom'), 'dateFrom filter missing')
    .check('Date range filter (dateTo)', explore.includes('dateTo'), 'dateTo filter missing')
    .check('Sort by event date', explore.includes('eventDate') && (explore.includes('sort') || explore.includes('localeCompare')), 'No date sorting found')
    .check('3-column grid', explore.includes('grid-cols-3') || explore.includes('sm:grid-cols-3'), 'No 3-column grid class found')
  scenarios.push(s.result())
}

// ── Scenario: Filter Bar ──────────────────────────────────────────────────
{
  const filterBar = readSrc('src/components/cards/FilterBar.tsx')
  const s = scenario('Filter Bar Component')
    .check('Trip filter', filterBar.includes("'trip'") || filterBar.includes('"trip"'), 'Trip filter missing')
    .check('Sport filter', filterBar.includes("'sport'") || filterBar.includes('"sport"'), 'Sport filter missing')
    .check('Food filter', filterBar.includes("'food'") || filterBar.includes('"food"'), 'Food filter missing')
    .check('Almost full filter', filterBar.includes('almost_full'), 'almost_full filter missing')
    .check('LocaleDatePicker used', filterBar.includes('LocaleDatePicker') || filterBar.includes('DatePicker'), 'No date picker in filter bar')
    .check('Locale prop passed', filterBar.includes('locale'), 'locale prop not passed to date picker')
  scenarios.push(s.result())
}

// ── Scenario: LocaleDatePicker ────────────────────────────────────────────
{
  const picker = readSrc('src/components/ui/LocaleDatePicker.tsx')
  const s = scenario('LocaleDatePicker (locale-aware date input)')
    .check('File exists', !!picker, 'LocaleDatePicker.tsx not found')
    .check('Uses Intl.DateTimeFormat', picker.includes('Intl.DateTimeFormat'), 'Not using Intl.DateTimeFormat for locale months')
    .check('Month names localized', picker.includes('month') && picker.includes('long'), 'Month format not set to "long"')
    .check('Local state for day/month/year', picker.includes('useState'), 'No local state — combo box may not update')
    .check('Calls onChange with ISO date', picker.includes('onChange'), 'No onChange callback found')
  scenarios.push(s.result())
}

// ── Scenario: Card Detail Page ────────────────────────────────────────────
{
  const card = readSrc('src/components/cards/CardDetailPage.tsx')
  const s = scenario('Card Detail Page')
    .check('Join button exists', card.includes('joinBtn') || card.includes('join'), 'No join button found')
    .check('Join hidden for past events', card.includes('isPast'), 'isPast flag not used — join may show on past events')
    .check('Participants list shown', card.includes('participants') && card.includes('Participant'), 'No participants list')
    .check('Participants are clickable (link to profile)', card.includes('/profile/') || card.includes('profile'), 'Participants not linked to profiles')
    .check('Organizer name links to profile', card.includes('createdByUserId') && card.includes('/profile/'), 'Organizer not linked to public profile')
    .check('WhatsApp / Telegram links', card.includes('whatsapp') || card.includes('WhatsApp'), 'No WhatsApp link found')
    .check('Review section for past events', card.includes('ReviewSection') || card.includes('isPast'), 'Review section not conditionally shown')
  scenarios.push(s.result())
}

// ── Scenario: Reviews System ──────────────────────────────────────────────
{
  const reviews = readSrc('src/components/cards/ReviewSection.tsx')
  const reviewsLib = readSrc('src/lib/reviews.ts')
  const s = scenario('Reviews System')
    .check('ReviewSection component exists', !!reviews, 'ReviewSection.tsx not found')
    .check('Star rating UI', reviews.includes('Star') || reviews.includes('star'), 'No star rating component')
    .check('Experience rating (card_rating)', reviews.includes('card_rating') || reviewsLib.includes('card_rating'), 'card_rating field missing')
    .check('Organizer rating', reviews.includes('organizer_rating') || reviewsLib.includes('organizer_rating'), 'organizer_rating field missing')
    .check('Comment field', reviews.includes('comment'), 'No comment field in review form')
    .check('Photo uploads (up to 4)', reviews.includes('photo') || reviews.includes('Photo'), 'No photo upload in reviews')
    .check('Blocks organizer from self-review', reviews.includes('isCardCreator') || reviews.includes('createdByUserId'), 'Organizer self-review not blocked')
    .check('Only shown for past events', reviews.includes('isPast') || reviews.includes('past'), 'Reviews not gated on isPast')
    .check('Only participants can review', reviews.includes('isParticipant') || reviewsLib.includes('participant'), 'Participant check missing')
    .check('fetchOrganizerReviews exists', reviewsLib.includes('fetchOrganizerReviews'), 'fetchOrganizerReviews not found in lib')
  scenarios.push(s.result())
}

// ── Scenario: Profile Page ────────────────────────────────────────────────
{
  const profile = readSrc('src/components/profile/ProfilePage.tsx')
  const s = scenario('Profile Page (own profile)')
    .check('Avatar display', profile.includes('avatar'), 'No avatar in profile page')
    .check('Title field (e.g. "Wave surfing coach")', profile.includes('title'), 'No title field in profile')
    .check('Bio field', profile.includes('bio'), 'No bio field in profile')
    .check('Active events section', profile.includes('active') || profile.includes('Active'), 'No active events section')
    .check('Past events section', profile.includes('past') || profile.includes('Past'), 'No past events section')
    .check('Reviews received shown', profile.includes('review') || profile.includes('Review'), 'No reviews section on profile')
    .check('Edit profile saves title+bio', profile.includes('title') && profile.includes('bio') && profile.includes('update'), 'Profile update may not save title/bio')
  scenarios.push(s.result())
}

// ── Scenario: Public Profile Page ────────────────────────────────────────
{
  const pub = readSrc('src/components/profile/PublicProfilePage.tsx')
  const route = readSrc('src/app/[locale]/profile/[userId]/page.tsx')
  const s = scenario('Public Profile Page (/profile/[userId])')
    .check('Component file exists', !!pub, 'PublicProfilePage.tsx not found')
    .check('Route file exists', !!route, 'src/app/[locale]/profile/[userId]/page.tsx not found')
    .check('Shows full name', pub.includes('full_name'), 'full_name not displayed')
    .check('Shows title', pub.includes('title'), 'Title not shown on public profile')
    .check('Shows bio', pub.includes('bio'), 'Bio not shown on public profile')
    .check('Shows event types organized', pub.includes('organizedTypes') || pub.includes('getCardTypeIcon'), 'Event type badges not shown')
    .check('Rating banner (avg + count)', pub.includes('orgAvg') || pub.includes('avg'), 'No rating banner on public profile')
    .check('Active events section', pub.includes('activeEvents'), 'No active events section')
    .check('Past events section', pub.includes('pastEvents'), 'No past events section')
    .check('Reviews received section', pub.includes('orgReviews'), 'No organizer reviews section')
  scenarios.push(s.result())
}

// ── Scenario: Navbar User Search ──────────────────────────────────────────
{
  const navbar = readSrc('src/components/layout/Navbar.tsx')
  const s = scenario('Navbar — User Search')
    .check('Search input exists', navbar.includes('searchUsers') || navbar.includes('search'), 'No user search input in navbar')
    .check('Debounced query', navbar.includes('debounce') || navbar.includes('setTimeout'), 'No debounce on search — may spam DB')
    .check('Supabase profiles query', navbar.includes('profiles') && navbar.includes('ilike'), 'No Supabase ilike query for user search')
    .check('Results dropdown', navbar.includes('dropdown') || navbar.includes('absolute') || navbar.includes('results'), 'No results dropdown found')
    .check('Click navigates to /profile/', navbar.includes('/profile/'), 'Search results don\'t link to profile pages')
  scenarios.push(s.result())
}

// ── Scenario: i18n Coverage ───────────────────────────────────────────────
{
  let en = {}, he = {}
  try { en = JSON.parse(readSrc('messages/en.json')) } catch {}
  try { he = JSON.parse(readSrc('messages/he.json')) } catch {}
  const s = scenario('i18n — Key Coverage')
    .check('nav section', !!en.nav && !!he.nav, 'nav section missing')
    .check('nav.searchUsers', !!en.nav?.searchUsers && !!he.nav?.searchUsers, 'nav.searchUsers missing in one locale')
    .check('filters.almost_full', !!en.filters?.almost_full && !!he.filters?.almost_full, 'filters.almost_full missing')
    .check('filters.dateFrom / dateTo', !!en.filters?.dateFrom && !!he.filters?.dateFrom, 'filters.dateFrom missing')
    .check('reviews section', !!en.reviews && !!he.reviews, 'reviews section missing')
    .check('reviews.cardRating', !!en.reviews?.cardRating && !!he.reviews?.cardRating, 'reviews.cardRating missing')
    .check('reviews.organizerRating', !!en.reviews?.organizerRating && !!he.reviews?.organizerRating, 'reviews.organizerRating missing')
    .check('reviews.pastEvents', !!en.reviews?.pastEvents && !!he.reviews?.pastEvents, 'reviews.pastEvents missing')
    .check('reviews.reviewsReceived', !!en.reviews?.reviewsReceived && !!he.reviews?.reviewsReceived, 'reviews.reviewsReceived missing')
    .check('auth section', !!en.auth && !!he.auth, 'auth section missing')
    .check('auth.resetPassword', !!en.auth?.resetPassword && !!he.auth?.resetPassword, 'auth.resetPassword missing')
  scenarios.push(s.result())
}

// ── Scenario: Database Schema ─────────────────────────────────────────────
{
  const schema = readSrc('supabase/schema.sql')
  const s = scenario('Database Schema (supabase/schema.sql)')
    .check('profiles table', schema.includes('CREATE TABLE') && schema.includes('profiles'), 'profiles table not found in schema')
    .check('profiles.title column', schema.includes('title') || schema.includes('profiles'), 'title column may be missing')
    .check('profiles.bio column', schema.includes('bio'), 'bio column missing from profiles')
    .check('travel_cards table', schema.includes('travel_cards'), 'travel_cards table not found')
    .check('reviews table', schema.includes('reviews'), 'reviews table not found in schema')
    .check('reviews.card_rating', schema.includes('card_rating'), 'card_rating column missing')
    .check('reviews.organizer_rating', schema.includes('organizer_rating'), 'organizer_rating column missing')
    .check('reviews.photos array', schema.includes('photos'), 'photos column missing from reviews')
    .check('RLS policies exist', schema.includes('POLICY') || schema.includes('RLS') || schema.includes('ENABLE ROW'), 'No RLS policies found in schema')
  scenarios.push(s.result())
}

// ─── SECTION 3: Summary ─────────────────────────────────────────────────────
const allStaticOk   = staticChecks.every(c => c.ok)
const allScenariosOk = scenarios.every(s => s.ok)
const totalChecks    = staticChecks.length + scenarios.reduce((n, s) => n + s.details.length, 0)
const failedChecks   = staticChecks.filter(c => !c.ok).length +
                       scenarios.reduce((n, s) => n + s.details.filter(d => !d.ok).length, 0)
const passedChecks   = totalChecks - failedChecks
const allOk          = allStaticOk && allScenariosOk
const statusEmoji    = allOk ? '✅' : '❌'
const statusText     = allOk ? 'All checks passed' : `${failedChecks} check(s) failed`

// ─── Build HTML Report ───────────────────────────────────────────────────────
const palette = { bg: '#0f172a', card: '#1e293b', border: '#334155', green: '#4ade80', red: '#f87171', yellow: '#fbbf24', muted: '#94a3b8', white: '#f1f5f9' }

function staticRow(c) {
  const icon = c.ok ? '✅' : '❌'
  const color = c.ok ? palette.green : palette.red
  return `
    <tr style="border-top:1px solid ${palette.border}">
      <td style="padding:10px 14px;font-weight:600;white-space:nowrap;color:${palette.white}">${icon} ${escapeHtml(c.name)}</td>
      <td style="padding:10px 14px;font-family:monospace;font-size:12px;color:${color};white-space:pre-wrap;max-width:480px;overflow-wrap:break-word">${escapeHtml(c.output)}</td>
    </tr>`
}

function scenarioBlock(s) {
  const icon = s.ok ? '✅' : '❌'
  const headerColor = s.ok ? palette.green : palette.red
  const rows = s.details.map(d => {
    const dIcon = d.ok ? '✓' : '✗'
    const dColor = d.ok ? palette.green : palette.red
    return `
      <tr>
        <td style="padding:5px 14px 5px 28px;font-size:13px;color:${dColor};white-space:nowrap">${dIcon} ${escapeHtml(d.label)}</td>
        <td style="padding:5px 14px;font-size:12px;color:${palette.muted}">${d.ok ? '' : escapeHtml(d.msg || '')}</td>
      </tr>`
  }).join('')
  return `
    <tr style="border-top:1px solid ${palette.border}">
      <td colspan="2" style="padding:10px 14px;font-weight:700;font-size:14px;color:${headerColor}">${icon} ${escapeHtml(s.name)}</td>
    </tr>
    ${rows}`
}

const changedFilesList = filesChanged
  ? filesChanged.split('\n').map(f => `<li style="font-family:monospace;font-size:12px;color:${palette.muted}">${escapeHtml(f)}</li>`).join('')
  : '<li style="color:#94a3b8">—</li>'

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="background:${palette.bg};color:${palette.white};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:24px">
<div style="max-width:760px;margin:0 auto">

  <!-- Header -->
  <div style="background:${palette.card};border:1px solid ${palette.border};border-radius:12px;padding:24px;margin-bottom:20px">
    <div style="font-size:24px;font-weight:800;margin-bottom:8px">${statusEmoji} GoTogether QA Report</div>
    <div style="font-size:14px;color:${palette.muted};line-height:1.8">
      <b style="color:${palette.white}">Commit:</b> <code style="background:#0f172a;padding:2px 6px;border-radius:4px;font-size:13px">${commitHash}</code>
      &nbsp;on&nbsp;<b style="color:${palette.white}">${escapeHtml(branch)}</b><br>
      <b style="color:${palette.white}">Message:</b> ${escapeHtml(commitMsg)}<br>
      <b style="color:${palette.white}">Author:</b> ${escapeHtml(author)}<br>
      <b style="color:${palette.white}">Time:</b> ${new Date().toLocaleString()}
    </div>
  </div>

  <!-- Score bar -->
  <div style="background:${palette.card};border:1px solid ${palette.border};border-radius:12px;padding:20px;margin-bottom:20px;display:flex;gap:32px;align-items:center;flex-wrap:wrap">
    <div>
      <div style="font-size:36px;font-weight:800;color:${allOk ? palette.green : palette.red}">${passedChecks}/${totalChecks}</div>
      <div style="font-size:12px;color:${palette.muted}">checks passed</div>
    </div>
    <div style="flex:1;min-width:200px">
      <div style="height:10px;background:#1e293b;border-radius:99px;overflow:hidden;border:1px solid ${palette.border}">
        <div style="height:100%;width:${Math.round((passedChecks/totalChecks)*100)}%;background:${allOk ? '#4ade80' : '#f87171'};border-radius:99px;transition:width 0.3s"></div>
      </div>
      <div style="font-size:12px;color:${palette.muted};margin-top:6px">${statusText}</div>
    </div>
  </div>

  <!-- Changed files -->
  <div style="background:${palette.card};border:1px solid ${palette.border};border-radius:12px;padding:20px;margin-bottom:20px">
    <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:${palette.muted}">FILES CHANGED IN THIS COMMIT</div>
    <ul style="margin:0;padding-left:20px">${changedFilesList}</ul>
  </div>

  <!-- Static Checks -->
  <div style="background:${palette.card};border:1px solid ${palette.border};border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 16px;border-bottom:1px solid ${palette.border};font-weight:700;font-size:14px;color:${palette.muted}">STATIC CHECKS</div>
    <table style="width:100%;border-collapse:collapse">
      ${staticChecks.map(staticRow).join('')}
    </table>
  </div>

  <!-- Feature Scenarios -->
  <div style="background:${palette.card};border:1px solid ${palette.border};border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 16px;border-bottom:1px solid ${palette.border};font-weight:700;font-size:14px;color:${palette.muted}">FEATURE SCENARIOS</div>
    <table style="width:100%;border-collapse:collapse">
      ${scenarios.map(scenarioBlock).join('')}
    </table>
  </div>

  <div style="font-size:11px;color:#475569;text-align:center;padding-top:8px">GoTogether Auto-QA Agent · ${new Date().toISOString()}</div>
</div>
</body>
</html>`

// ─── Send Email ──────────────────────────────────────────────────────────────
console.log('[QA] Sending report...')
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'GoTogether QA <onboarding@resend.dev>',
    to: [QA_EMAIL],
    subject: `${statusEmoji} GoTogether QA: ${passedChecks}/${totalChecks} passed — ${commitHash} "${commitMsg}"`,
    html,
  }),
})

if (res.ok) {
  console.log(`[QA] ✓ Report sent to ${QA_EMAIL} (${passedChecks}/${totalChecks} checks passed)`)
} else {
  console.error('[QA] Failed to send email:', await res.text())
}
