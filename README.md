# LinguaHe — English Learning for Hebrew Speakers

A modern English learning app built with React, TypeScript, Supabase, and Vite.

## Tech Stack

- React 18 + TypeScript
- Vite
- Supabase (auth + PostgreSQL)
- React Query v5
- React Router v6
- Tailwind CSS

## Local Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/linguahe.git
cd linguahe

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 4. Run
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Database

Run in this order in Supabase SQL Editor:
1. `supabase/schema.sql`
2. `supabase/seed.sql`

## Deployment

Push to GitHub → Vercel auto-deploys.

Required Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
