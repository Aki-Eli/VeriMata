# Spot the Bot - Quick Start Guide

## What You've Got

**Spot the Bot** is a fully functional web app for training AI detection skills through daily 5-minute quizzes. The app is built with:
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with pre-configured schema
- **Styling**: Tailwind CSS v4 with custom color system

## One-Time Setup (2 minutes)

### 1. Environment Variables
Create `.env.local` in the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Get these values from your Supabase dashboard (Settings → API → URL and anon key).

### 2. Seed Quiz Data
```bash
pnpm exec node scripts/seed-quiz.mjs
```

This creates today's quiz with 5 sample questions comparing human vs AI content.

## Running the App

```bash
pnpm dev
```

Visit `http://localhost:3000` and sign up for an account!

## Core Features

### 🎮 Arena (Daily Quiz)
- 5 questions per day
- Compare human vs AI-generated content side-by-side
- Earn XP for correct answers
- View educational explanations after each question
- XP multiplied by your daily streak

### 🏆 Leaderboard
- Sort by XP, Accuracy, or Streak
- See your rank among all players
- Real-time stats

### 👤 Profile
- View your stats (XP, Quizzes Played, Accuracy)
- Unlock badges through gameplay
- Track best and current streaks

### 📚 Guide
- Learn how to spot AI patterns
- Tips for misinformation detection
- FAQ about game mechanics

## Key Mechanics

**XP System:**
- 10 XP per correct answer
- Streak multiplier: Day 1 = 1x, Day 2 = 2x, Day 3 = 3x, etc.
- Missing a day resets your streak to 0

**Badges Unlocked At:**
- First Detection: Complete 1 quiz
- Accuracy Expert: 90% accuracy on any quiz
- Week Warrior: 7-day streak
- XP Master: 1000 XP
- Detective: 5000 XP
- Master Detective: 10000 XP

## Project Structure

```
app/
├── layout.tsx              # Root layout with AuthProvider
├── page.tsx               # Redirect to auth/dashboard
├── auth/
│   ├── signin/page.tsx    # Sign in form
│   └── signup/page.tsx    # Sign up form
└── dashboard/
    ├── layout.tsx         # Dashboard wrapper
    ├── page.tsx          # Home/stats page
    ├── arena/page.tsx    # Quiz gameplay
    ├── leaderboard/page.tsx
    ├── profile/page.tsx
    └── guide/page.tsx

components/
├── navigation.tsx         # Top navigation bar
├── protected-route.tsx    # Auth guard wrapper
└── ui/button.tsx         # UI button component

lib/
├── supabase.ts           # Supabase client config
├── auth.ts               # Auth utility functions
├── auth-context.tsx      # React auth context
├── quiz.ts               # Quiz logic and queries
└── badges.ts             # Badge system logic

scripts/
└── seed-quiz.mjs         # Populate quiz questions
```

## Database Schema

All tables are pre-created. Key tables:
- **users**: Profile data, XP, streaks
- **daily_quizzes**: One quiz per date
- **quiz_questions**: 5 questions per quiz
- **user_quiz_responses**: Track user answers
- **badges**: Achievement definitions
- **user_badges**: Track earned badges

## Customization

### Add More Quiz Questions
Edit `scripts/seed-quiz.mjs`:
```javascript
const quizQuestions = [
  {
    human: 'Your human content...',
    ai: 'Your AI content...',
    correctAnswer: 'human', // or 'ai'
    humanExplanation: 'Why this is human',
    aiExplanation: 'Why this is AI',
    visualFlaws: [],
    linguisticPatterns: [],
  },
  // Add more questions...
]
```

Then re-run seed:
```bash
pnpm exec node scripts/seed-quiz.mjs
```

### Change XP Values
In `lib/quiz.ts`, line ~77:
```typescript
const xpEarned = isCorrect ? 10 : 0  // Change 10 to your desired base XP
```

### Modify Colors
In `app/globals.css`, update the color variables under `:root` and `.dark`:
```css
--primary: #3B82F6;      /* Blue */
--secondary: #EC4899;    /* Pink */
--accent: #F59E0B;       /* Amber */
```

## Deployment

### Deploy to Vercel (Recommended)
1. Push code to GitHub
2. Import repo in Vercel
3. Add environment variables
4. Deploy!

The app will automatically use `pnpm` and Next.js optimizations.

### Deploy Elsewhere
- **Node.js** with `pnpm build && pnpm start`
- **Docker** with Next.js container
- Any static host (after `pnpm build` → `.next` output)

## Troubleshooting

**"Quiz Not Available"**
→ Run `pnpm exec node scripts/seed-quiz.mjs` to populate today's quiz

**Auth not working**
→ Check `.env.local` has correct Supabase URL and keys

**Database tables missing**
→ Check Supabase project dashboard to verify tables exist

**Styles look broken**
→ Clear `.next` folder: `rm -rf .next && pnpm dev`

## Next Steps

- ✅ Sign up and play your first quiz
- ✅ Build your streak to unlock badges
- ✅ Customize quiz questions for your audience
- ✅ Deploy to production
- 🚀 Consider building the browser extension overlay (Phase 2)

## Support

For questions or issues:
1. Check the Guide page in the app
2. Review `SETUP.md` for detailed setup instructions
3. Check Supabase docs: https://supabase.com/docs

---

**Happy detecting!** Test your AI detection skills daily and climb the leaderboard. 🎯
