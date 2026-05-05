# GoTogether

> Find your travel crew. Join group trips, workshops, and adventures.

GoTogether connects people who want to travel together. Create an event card for your trip, workshop, sports activity, or food experience — others can discover it, join, and connect with you via WhatsApp or Telegram.

---

## Features

- **Cinematic landing** — full-viewport hero with floating photo collage from real cards, mouse-parallax depth, word-by-word headline reveal, animated live counter, and scroll cue
- **Explore & Filter** — browse cards by type (Trips, Attractions, Workshops, Sports, Food), date range, and availability with a clear active-state pill that morphs between selections
- **Grid / Map toggle** — switch between card grid and an interactive Mapbox view of all events
- **Create Cards** — multi-step form with location, dates, participant limits, and chat links
- **Participant Tracking** — live min/max progress bar with a clear minimum-limit marker line
- **Reviews** — rate experiences and organizers after events with gold stars; photo uploads supported
- **Public Profiles** — view any organizer's past events, ratings, and bio
- **User Search** — find people from the navbar with full keyboard navigation (↑/↓/Enter/Esc)
- **Notifications** — bell with live unread badge that clears on open and marks all read
- **Scroll-aware Navbar** — quiet over the hero, solidifies with a soft shadow once you scroll into content
- **Bilingual** — Hebrew (RTL) and English (LTR) with full i18n parity
- **Authentication** — email/password sign up, login, and password reset

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (CSS-first @theme) + Framer Motion |
| Theme | "Deep Tide" — midnight-teal surfaces with electric cyan + violet gradient accents |
| i18n | next-intl (he + en) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Maps | Mapbox GL JS |
| Icons | Lucide React |
| Email | Resend |
| Deploy | Vercel (auto-deploy from `master`) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Supabase](https://supabase.com) account (free)

### Installation

```bash
# Clone
git clone https://github.com/alonarbel/GoTogether.git
cd GoTogether

# Install dependencies
pnpm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — defaults to Hebrew. Visit `/en` for English.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token (for map view) |
| `RESEND_API_KEY` | Resend API key (for QA email reports) |

---

## Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor**
3. Run `supabase/schema.sql`
4. Add your project URL and anon key to `.env.local`

The schema creates 5 tables with RLS enabled: `profiles`, `travel_cards`, `card_images`, `participants`, `reviews`.

---

## Project Structure

```
src/
├── app/
│   └── [locale]/              # i18n routing (he / en)
│       ├── page.tsx            # Explore page
│       ├── auth/               # Login / register / reset
│       ├── cards/[id]/         # Card detail + edit
│       ├── create/             # Create card (multi-step)
│       ├── my-events/          # User's joined & created events
│       └── profile/[userId]/   # Public profile
├── components/
│   ├── auth/                   # AuthPage
│   ├── cards/                  # CardDetail, FilterBar, ReviewSection, TravelCard, ParticipantBar
│   ├── create/                 # CreateCardPage
│   ├── layout/                 # Navbar (scroll-aware), NotificationsBell
│   ├── profile/                # ProfilePage, PublicProfilePage
│   ├── ui/                     # CardSkeleton, LocaleDatePicker, Toast
│   ├── ExplorePage.tsx
│   └── HeroCinematic.tsx       # Full-viewport landing hero
├── lib/
│   ├── auth-context.tsx
│   ├── cards.ts
│   ├── reviews.ts
│   ├── supabase.ts
│   └── utils.ts
├── types/index.ts
└── i18n/
messages/
├── en.json
└── he.json
supabase/
├── schema.sql
└── seed.sql
e2e/                            # Playwright tests
```

---

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alonarbel/GoTogether)

Add your environment variables under **Project Settings → Environment Variables** in the Vercel dashboard.

---

## Roadmap

- [x] Authentication (email/password)
- [x] Explore with filters and pagination
- [x] Create / edit cards
- [x] Participant tracking
- [x] Reviews with photos
- [x] Public profiles
- [x] User search
- [x] Bilingual (he + en)
- [ ] Real-time participant updates (Supabase Realtime)
- [ ] Interactive map view (Mapbox)
- [ ] Social login (Google / Apple)
- [ ] Mobile app (React Native / Expo)

---

## License

MIT
