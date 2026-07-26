-- UNESCO Spot the Bot Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Users Profile Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Daily Quizzes Table
CREATE TABLE IF NOT EXISTS public.daily_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.daily_quizzes(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  human_content TEXT NOT NULL,
  ai_content TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('human', 'ai')),
  explanation_human TEXT,
  explanation_ai TEXT,
  visual_flaws TEXT[] DEFAULT '{}',
  linguistic_patterns TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Quiz Responses Table
CREATE TABLE IF NOT EXISTS public.user_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL CHECK (user_answer IN ('human', 'ai')),
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_date, question_id)
);

-- 5. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_threshold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Spot the Bot App
CREATE POLICY "Public read daily_quizzes" ON public.daily_quizzes FOR SELECT USING (true);
CREATE POLICY "Public insert daily_quizzes" ON public.daily_quizzes FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Public insert quiz_questions" ON public.quiz_questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users insert self" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update self" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Public read user_quiz_responses" ON public.user_quiz_responses FOR SELECT USING (true);
CREATE POLICY "Public insert user_quiz_responses" ON public.user_quiz_responses FOR ALL USING (true);

CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Public read user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Public insert user_badges" ON public.user_badges FOR INSERT WITH CHECK (true);
