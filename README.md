# GoTogether 🌍

> Find your travel crew. Join group trips, workshops, and adventures worldwide.

GoTogether is a web app that connects travelers looking for people to join them on trips, tours, workshops, sports activities, and more. Users can create cards with their plans and others can join — splitting costs and sharing experiences.

## ✨ Features

- 🗺️ **Explore cards** — browse by location or category
- 🔍 **Filter** by type: Trips, Attractions, Workshops, Sports, Food, Other
- 📋 **Create cards** — multi-step form with rich details
- 👥 **Participant tracking** — live min/max progress bar
- 💬 **Group chat links** — WhatsApp & Telegram integration
- 🌐 **Bilingual** — Hebrew (RTL) + English (LTR)
- 🌙 **Dark mode** — beautiful dark UI by default

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (`npm install -g pnpm`)
- [Supabase](https://supabase.com) account (free)
- [Mapbox](https://mapbox.com) account (free tier)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/alonarbel/GoTogether.git
cd GoTogether

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your keys

# 4. Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the app runs in Hebrew by default. Visit `/en` for English.

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Your Mapbox public token |

> **Note:** The app runs with mock data even without Supabase/Mapbox credentials. Set them up when you're ready to go live.

## 🗄️ Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Run the contents of `supabase/schema.sql`
4. Copy your project URL and anon key into `.env.local`

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| i18n | next-intl |
| Database | Supabase (PostgreSQL) |
| Maps | Mapbox GL JS |
| Icons | Lucide React |

## 🌐 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

Or click: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alonarbel/GoTogether)

## 📁 Project Structure

```
src/
├── app/
│   └── [locale]/          # i18n routing (he / en)
│       ├── page.tsx        # Explore page
│       ├── cards/[id]/     # Card detail
│       └── create/         # Create card
├── components/
│   ├── layout/Navbar.tsx
│   ├── cards/              # Card components
│   └── create/             # Create form
├── lib/
│   ├── mock-data.ts        # Sample data
│   ├── supabase.ts         # DB client
│   └── utils.ts
├── types/index.ts
└── i18n/
messages/
├── he.json                 # Hebrew translations
└── en.json                 # English translations
supabase/
└── schema.sql              # Database schema + RLS
```

## 🗺️ Roadmap

- [ ] **Authentication** — sign in with Google / Apple
- [ ] **Payments** — split costs via Stripe
- [ ] **Real-time** — live participant updates via Supabase Realtime
- [ ] **Maps** — interactive Mapbox map with card pins
- [ ] **Push notifications** — someone joined your card!
- [ ] **Mobile app** — React Native / Expo
- [ ] **Reviews** — rate experiences after trips
- [ ] **Verification** — verified traveler badges

## 📄 License

MIT
