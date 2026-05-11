# LinguaHe — English Learning for Hebrew Speakers

## Quick Start

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key

npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Database

Run in Supabase SQL Editor in order:
1. `supabase/schema.sql`
2. `supabase/seed.sql`

## Deployment

Push to GitHub → Vercel auto-deploys.

Required Vercel env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
