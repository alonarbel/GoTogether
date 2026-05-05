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

### Navbar
- The Navbar is `position: fixed` (set via inline `style`, not Tailwind, to bypass Tailwind v4 / opacity quirks — see Styling gotchas below).
- It is **scroll-aware**: quiet/transparent at top of page, solid + bordered + shadowed once `window.scrollY > 24`. Listener is attached with `{ passive: true }` and toggles inline-style background/border/shadow only — no layout thrash.
- Z-stacking: navbar `zIndex: 100`, search dropdown `zIndex: 9999` (inline). High-z dropdown is intentional — profile pages and other surfaces render `motion.div` wrappers whose transforms create stacking contexts that can otherwise shadow the dropdown.
- Do **not** wrap the navbar in `motion.nav` — framer-motion's `initial={{ opacity: 0 }}` leaves an SSR inline `opacity:0;transform:translateY(-16px)` style. If client-side hydration/animation is delayed for any reason, the navbar stays invisible. Keep it as a plain `<nav>`.

### Landing hero (`src/components/HeroCinematic.tsx`)
- Full-viewport (`min-h-[100svh]`) hero with: floating photo tiles drawn from the first image of each card with mouse-parallax depth (via `useMotionValue` + `useSpring` + `useTransform` inside a child `PhotoTile` component — never call `useTransform` inside `.map()` directly, that breaks rules of hooks); a word-stagger headline reveal where the last word picks up `.text-gradient`; an animated odometer counter for active card count; a focus-ringed search input; a bouncing scroll cue button that calls `onScrollCue` to smooth-scroll to the grid section.
- Hero photos avoid the headline area by using percentage-based positions tuned to keep the center column clear; if the headline length grows, photo positions may need re-tuning.

### Theme — "Deep Tide"
- Surfaces: deep midnight-teal (`--color-night-1000` = `#0a1620`).
- Accent: single electric cyan-teal (`--color-coral-500` = `#06b6d4`). The token name is `coral-*` for historical reasons; treat it as the brand accent.
- Gradients: cyan → violet (`#06b6d4 → #8b5cf6`) is the canonical brand gradient, used on buttons, active filter pills, the grid/map toggle, card hover rings (masked border), and the participant bar fill.
- No glow halos: the previous "Aurora" theme had heavy `box-shadow: 0 0 32px rgba(...)` glow rings on every interactive element. Those are removed. The only persistent ambient glow is the body's subtle cyan + violet orb gradient and the live-dot's emerald pulse.
- Stars: rendered with inline `style={{ color: '#fbbf24', fill: '#fbbf24' }}` (gold) — see Styling gotchas for why.

### Styling gotchas (Tailwind v4)
**Tailwind v4 silently drops `/opacity` modifiers on arbitrary CSS-variable values.** This bit us repeatedly:
- `bg-[--color-night-1000]/65` → compiles to no background → element appears transparent
- `text-[--color-amber-400]/70` → compiles to no color
- `fill-[--color-amber-400]` on Lucide icons → unreliable; the SVG `fill` may stay `currentColor`

**Rules**:
1. For interactive states, button highlights, badges, focus rings, navbar background, and any place where the visibility of the styling is critical — **use inline `style={{ background, color, ... }}` with literal `rgba()` or hex values**, not Tailwind arbitrary classes.
2. For Lucide `<Star />` and similar icons that need a colored `fill`, set `style={{ color, fill }}` directly — don't rely on `fill-[--color-...]` Tailwind classes.
3. Plain `bg-[--color-coral-500]` (no opacity modifier) is safe and works.
4. Gradient stops via tokens (`from-[--color-coral-500]`) work but are also brittle — prefer inline `style={{ background: 'linear-gradient(...)' }}` for visible accents.

### Navbar search keyboard nav
ArrowDown/ArrowUp navigates results, Enter selects (or selects index 0 if nothing highlighted), Esc closes. Mouse hover updates `selectedIndex` so the highlight stays in sync if the user mixes inputs. The active row gets an inline cyan-tinted background and a 3px cyan→violet leading-edge accent stripe (see Styling gotchas — needs inline style).

### Notifications bell
- Polls `unreadCount(userId)` every 60s.
- **Opening the bell marks all as read server-side AND sets local count to 0 immediately** so the badge clears without waiting for the next poll. This is intentional UX; if you want lazy "mark on click" instead, change the `handleToggle` handler.
- Badge background is a solid inline rose→red gradient (not Tailwind classes — see gotchas).

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
