# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm exec playwright test          # Run all E2E tests
pnpm exec playwright test e2e/auth.spec.ts   # Run a single test file
pnpm exec playwright test --ui     # Interactive test runner
```

E2E tests require `QA_TEST_EMAIL` and `QA_TEST_PASSWORD` in `.env.local` for auth-dependent scenarios. Tests skip gracefully when credentials are absent.

## Architecture

### Routing
All pages live under `src/app/[locale]/` — every route is locale-prefixed (`/he/...`, `/en/...`). The app defaults to Hebrew at `/`. next-intl handles locale detection and message loading from `messages/en.json` and `messages/he.json`.

### Data layer (`src/lib/`)
- **`supabase.ts`** — single shared Supabase client (anon key, used client-side)
- **`cards.ts`** — all CRUD for `travel_cards`, `card_images`, `participants`. Raw Supabase rows are mapped to `TravelCard` via `mapCard()`. All card reads use a single nested select that joins profiles, card_images, and participants in one query.
- **`reviews.ts`** — CRUD for `reviews` table
- **`auth-context.tsx`** — React context (`AuthProvider` / `useAuth`) that wraps Supabase Auth. Exposes `user`, `profile` (from `profiles` table), `session`, `loading`, `signOut`, `refreshProfile`. Auto-recreates missing profiles from auth metadata on login.
- **`utils.ts`** — `cn()` helper (clsx + tailwind-merge)

### Types (`src/types/index.ts`)
Central types: `TravelCard`, `UserProfile`, `Participant`, `Location`, `CardType`, `OrganizerRole`. The `mapCard()` function in `cards.ts` is the single source of truth for translating DB column names (snake_case) to these camelCase types.

### i18n
All user-facing strings must exist in both `messages/en.json` and `messages/he.json`. Hebrew is RTL — the `[locale]` segment controls `dir` on the `<html>` element. Use `useTranslations()` from next-intl in components.

### Database (Supabase)
Five tables, all with RLS enabled: `profiles`, `travel_cards`, `card_images`, `participants`, `reviews`. Schema is in `supabase/schema.sql`. Seed data in `supabase/seed.sql`. There is no local Supabase instance — the app always connects to the hosted project via `.env.local`.

### Card logic notes
- `organizer_role: 'traveler'` auto-joins the creator as a participant on card creation.
- Images are stored in `card_images` with a `position` column for ordering.
- Participant count is derived from the length of the joined `participants` array (not a stored column).

### E2E tests (`e2e/`)
Tests use `loginWithTestUser()` from `e2e/helpers.ts` for auth flows. `playwright.config.ts` auto-starts `pnpm dev` if no server is running. Reports are written to `playwright-report/`.

## Git & GitHub

**Remote:** `https://github.com/alonarbel/GoTogether.git` (single `master` branch — this is both the default and production branch).

**Commit automatically after every meaningful change.** After completing any task that modifies files, stage the relevant files and commit without waiting to be asked. Use clear, concise commit messages in the imperative mood (e.g. `feat: add X`, `fix: correct Y`, `chore: update Z`).

```bash
git add <files>
git commit -m "feat: describe what changed"
git push origin master
```

**Push to remote** after each commit so the GitHub repo stays in sync. Do not batch up multiple features into one push — push after each logical commit.

**Branching:** Work directly on `master` unless the change is large or risky, in which case create a feature branch and open a PR via `gh pr create`.
