# Spot the Bot — Combined Web App

A unified **Next.js** app that merges the training game with the Digital Nutrition Label content analyzer.

## What's inside

| Feature | Route |
|---|---|
| Sign in / Sign up | `/auth/signin`, `/auth/signup` |
| Dashboard home | `/dashboard` |
| AI Detection Quiz (Arena) | `/dashboard/arena` |
| **Content Analyzer** ← new | `/dashboard/analyzer` |
| Leaderboard | `/dashboard/leaderboard` |
| Guide | `/dashboard/guide` |
| Profile | `/dashboard/profile` |

### Content Analyzer
Paste text, a social media link, or upload an image — Gemini AI returns:
- AI-generated likelihood score (0–100 %)
- Detected bias flags / risk signals
- Plain-language reasoning

---

## Local development

```bash
# 1. Install deps
pnpm install

# 2. Copy env file and fill in your keys
cp .env.example .env.local

# 3. Run dev server (port 3001)
pnpm dev
```

### Required env vars

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as above (secret section) |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `SERP_API_KEY` | https://serpapi.com/dashboard (optional — for image quiz) |

---

## Deploy to Vercel

### First-time setup

1. Push the `combined/` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Vercel auto-detects Next.js. Leave build/output settings as-is.
4. Under **Environment Variables**, add every key from `.env.example`.
5. Click **Deploy**.

### After first deploy

- Copy your Vercel URL (e.g. `https://spot-the-bot.vercel.app`)
- Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to that URL
- In your Supabase dashboard → **Authentication → URL Configuration**, add the Vercel URL to **Redirect URLs**

### Subsequent deploys

Push to `main` — Vercel redeploys automatically.

---

## Database setup (Supabase)

Run the SQL files in order in the Supabase SQL Editor:

```
supabase-schema.sql      ← core tables (users, badges, quiz questions)
supabase-pool.sql        ← quiz pool tables
supabase-trigger.sql     ← auto-create user profile on signup
supabase-migration.sql   ← any later migrations
```

---

## Browser Extension

The `stb gemini/` folder contains the Chrome/Firefox extension.
It uses the **same Supabase project** — users sign in once and it works in both.

```bash
cd "stb gemini"
npm install
npm run build      # outputs to .output/chrome-mv3/
```

Load `.output/chrome-mv3/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).
