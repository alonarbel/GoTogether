# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Architecture

### Routing
All pages live under `src/app/[locale]/` — every route is locale-prefixed (`/he/...`, `/en/...`). The app defaults to Hebrew at `/`. next-intl handles locale detection and message loading from `messages/en.json` and `messages/he.json`.

### Data layer (`src/lib/`)
- **`supabase.ts`** — single shared Supabase client (anon key, used client-side)
- **`cards.ts`** — all CRUD for `travel_cards`, `card_images`, `participants`. Raw Supabase rows are mapped to `TravelCard` via `mapCard()`. All card reads use a single nested select that joins profiles, card_images, and participants in one query. `fetchCards()` also calls the `cleanup_expired_cards` RPC on every invocation (see Card expiry below). `fetchMyCards()` has no expiry filter — it returns all cards including past ones, intentionally.
- **`reviews.ts`** — CRUD for `reviews` table
- **`auth-context.tsx`** — React context (`AuthProvider` / `useAuth`) that wraps Supabase Auth. Exposes `user`, `profile` (from `profiles` table), `session`, `loading`, `signOut`, `refreshProfile`. Auto-recreates missing profiles from auth metadata on login.
- **`utils.ts`** — `cn()` helper (clsx + tailwind-merge)

### Types (`src/types/index.ts`)
Central types: `TravelCard`, `UserProfile`, `Participant`, `Location`, `CardType`, `OrganizerRole`. The `mapCard()` function in `cards.ts` is the single source of truth for translating DB column names (snake_case) to these camelCase types.

Valid `CardType` values: `'trip' | 'attraction' | 'workshop' | 'sport' | 'food' | 'other'`
Valid `OrganizerRole` values: `'traveler' | 'guide' | 'coach' | 'driver' | 'organizer'` — these are DB-enforced check constraints; `'instructor'` and similar are invalid.

### i18n
All user-facing strings must exist in both `messages/en.json` and `messages/he.json`. Hebrew is RTL — the `[locale]` segment controls `dir` on the `<html>` element. Use `useTranslations()` from next-intl in components.

### Database (Supabase)
Five tables, all with RLS enabled: `profiles`, `travel_cards`, `card_images`, `participants`, `reviews`. Schema is in `supabase/schema.sql`. Seed data in `supabase/seed.sql`. Migration SQL files live in `supabase/migrations/` and must be run manually in the Supabase dashboard SQL editor. There is no local Supabase instance — the app always connects to the hosted project via `.env.local`.

### Card logic notes
- `organizer_role: 'traveler'` auto-joins the creator as a participant on card creation.
- Images are stored in `card_images` with a `position` column for ordering.
- Participant count is derived from the length of the joined `participants` array (not a stored column).
- **Card expiry:** `fetchCards()` calls `cleanup_expired_cards()` (a `SECURITY DEFINER` RPC) which hard-deletes future cards whose `min_deadline < CURRENT_DATE`. Cards whose `event_date` is already in the past are preserved as historical records. This RPC must be registered in Supabase via `supabase/migrations/20260503_cleanup_expired_cards.sql`.

### Navbar z-index
The Navbar uses `z-[100]` and its search dropdown uses `z-[200]`. This is intentionally higher than the default `z-50` to stay above stacking contexts created by Framer Motion transforms on page content.

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
