# Spot the Bot - Setup Instructions

## Environment Setup

1. **Create `.env.local` file** in the project root with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for seeding)
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Database Setup**: The database schema is created automatically when you connect Supabase. Verify that all tables exist in your Supabase project.

## Seeding Quiz Data

To populate today's quiz with sample questions:

```bash
pnpm exec node scripts/seed-quiz.mjs
```

This will:
- Create today's daily quiz (if it doesn't exist)
- Insert 5 sample questions comparing human vs AI-generated content
- Each question includes correct answers and educational explanations

## Running the App

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Open in browser**:
   - Visit `http://localhost:3000`
   - You'll be redirected to the sign-in page

## User Registration & Authentication

1. **Sign Up**: Create an account with email, username, and password
2. **Sign In**: Log in with your credentials
3. **Dashboard**: After login, you'll see your stats and the Arena button

## Features

### Arena (Daily Quiz)
- Play 5 questions per day
- Compare human vs AI-generated content
- Earn XP for correct answers
- View explanations after each question
- Get immediate feedback on accuracy

### Leaderboard
- Sort by Total XP, Accuracy, or Streak
- See your rank among all players
- View community stats

### Profile
- Track your statistics (Total XP, Quizzes Completed, Overall Accuracy)
- View your badges and achievements
- See your current and best streaks

### Guide
- Learn how to spot AI content
- Understand common AI patterns
- Get pro tips for improving your detection skills
- FAQ about the game mechanics

## Streak System & XP Calculation

- **Base XP**: 10 points per correct answer
- **Streak Multiplier**: Your daily streak multiplies your XP earned
  - Day 1: 10 XP per correct answer
  - Day 2: 20 XP per correct answer (10 × 2)
  - Day 3: 30 XP per correct answer (10 × 3)
  - And so on...
- **Streak Reset**: Missing a day resets your streak to 0
- **Bonus**: Consecutive day streaks unlock special badges

## Badges & Achievements

Badges are automatically awarded when you meet conditions:
- **First Detection**: Complete your first quiz
- **Accuracy Expert**: Achieve 90% accuracy on any single quiz
- **Week Warrior**: Maintain a 7-day streak
- **XP Master**: Reach 1000 total XP
- **Detective**: Reach 5000 total XP
- **Master Detective**: Reach 10000 total XP

## Troubleshooting

### "Quiz Not Available" Message
- Run the seed script to generate today's quiz:
  ```bash
  pnpm exec node scripts/seed-quiz.mjs
  ```

### Authentication Issues
- Verify your Supabase credentials in `.env.local`
- Check that Supabase project is accessible
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Database Schema Missing
- Check your Supabase project dashboard
- Verify all tables were created during schema migration
- Required tables: users, daily_quizzes, quiz_questions, user_quiz_responses, badges, user_badges, leaderboard_cache

## API Endpoints

The app uses Supabase queries directly. No custom backend needed. All data operations go through Supabase client.

## Customization

### Adding More Quiz Questions
Edit `scripts/seed-quiz.mjs` and add to the `quizQuestions` array:

```javascript
{
  human: 'Your human-written content here',
  ai: 'Your AI-generated content here',
  correctAnswer: 'human', // or 'ai'
  humanExplanation: 'Why this is human...',
  aiExplanation: 'Why this is AI...',
  visualFlaws: ['Common AI tells'],
  linguisticPatterns: ['Patterns to notice'],
}
```

Then run the seed script again.

### Changing XP Values
Modify the XP calculations in `/lib/quiz.ts`:
- Change `xpEarned = isCorrect ? 10 : 0` to adjust base XP

## Future Enhancements

- Browser extension for real-world content detection
- Community content flagging system
- Advanced analytics dashboard
- Multiplayer challenges
- AI detection difficulty levels
- Custom quiz creation

## Support

For issues or questions, refer to the Guide page in the app or check the GitHub repository.
