-- Migration: fix user_quiz_responses to allow dynamic question IDs
-- Run this in Supabase SQL Editor

-- Drop the old table and recreate without FK on question_id
DROP TABLE IF EXISTS public.user_quiz_responses CASCADE;

CREATE TABLE public.user_quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  question_id TEXT NOT NULL,  -- no FK, accepts dynamic IDs
  user_answer TEXT NOT NULL CHECK (user_answer IN ('human', 'ai')),
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_date, question_id)
);

ALTER TABLE public.user_quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public all user_quiz_responses" ON public.user_quiz_responses FOR ALL USING (true) WITH CHECK (true);

-- Also update the users update policy to be explicit
DROP POLICY IF EXISTS "Users update self" ON public.users;
CREATE POLICY "Users update self" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
