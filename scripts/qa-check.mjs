#!/usr/bin/env node
/**
 * QA Check Script — runs after every git commit.
 * Checks: TypeScript, ESLint, then emails results via Resend.
 */
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Load .env.local
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
const QA_EMAIL = process.env.QA_EMAIL // your email address

if (!RESEND_API_KEY || !QA_EMAIL) {
  console.log('[QA] Missing RESEND_API_KEY or QA_EMAIL in .env.local — skipping email.')
  process.exit(0)
}

// Run a command and capture stdout+stderr
function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 120_000 })
    return { ok: true, output: out.trim() }
  } catch (err) {
    return { ok: false, output: (err.stdout || '') + (err.stderr || '') }
  }
}

// Get commit info
const commitHash = run('git rev-parse --short HEAD').output
const commitMsg = run('git log -1 --pretty=%s').output
const branch = run('git rev-parse --abbrev-ref HEAD').output
const author = run('git log -1 --pretty="%an <%ae>"').output

console.log(`[QA] Running checks for commit ${commitHash}...`)

const checks = []

// 1. TypeScript check
console.log('[QA] Running TypeScript check...')
const tsc = run('npx tsc --noEmit')
checks.push({
  name: 'TypeScript',
  ok: tsc.ok,
  output: tsc.ok ? 'No type errors found.' : tsc.output.slice(0, 3000),
})

// 2. ESLint
console.log('[QA] Running ESLint...')
const lint = run('npx next lint --max-warnings 0')
checks.push({
  name: 'ESLint',
  ok: lint.ok,
  output: lint.ok ? 'No lint errors found.' : lint.output.slice(0, 3000),
})

// Build summary
const allPassed = checks.every(c => c.ok)
const statusEmoji = allPassed ? '✅' : '❌'
const statusText = allPassed ? 'All checks passed' : 'Some checks failed'

// Build HTML email
const rows = checks.map(c => `
  <tr>
    <td style="padding:8px 12px;font-weight:600;white-space:nowrap">${c.ok ? '✅' : '❌'} ${c.name}</td>
    <td style="padding:8px 12px;font-family:monospace;font-size:13px;color:${c.ok ? '#16a34a' : '#dc2626'};white-space:pre-wrap">${escapeHtml(c.output)}</td>
  </tr>
`).join('')

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin:0 0 4px">${statusEmoji} GoTogether QA — ${statusText}</h2>
  <p style="margin:0 0 20px;color:#555">
    <strong>Commit:</strong> <code>${commitHash}</code> on <strong>${branch}</strong><br>
    <strong>Message:</strong> ${escapeHtml(commitMsg)}<br>
    <strong>Author:</strong> ${escapeHtml(author)}
  </p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb">Check</th>
        <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb">Result</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#9ca3af">GoTogether Auto-QA · ${new Date().toLocaleString()}</p>
</body>
</html>
`

// Send email via Resend
console.log('[QA] Sending email report...')
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'GoTogether QA <onboarding@resend.dev>',
    to: [QA_EMAIL],
    subject: `${statusEmoji} GoTogether QA: ${statusText} — ${commitHash} "${commitMsg}"`,
    html,
  }),
})

if (res.ok) {
  console.log(`[QA] Email sent to ${QA_EMAIL} ✓`)
} else {
  const err = await res.text()
  console.error('[QA] Failed to send email:', err)
}
