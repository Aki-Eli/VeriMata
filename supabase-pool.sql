-- Quiz Pool Tables
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.quiz_pool_text (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  human_content TEXT NOT NULL,
  ai_content TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_pool_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  real_image_url TEXT NOT NULL,
  ai_image_data TEXT NOT NULL,  -- base64 data URL
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quiz_pool_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_pool_image ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access text pool" ON public.quiz_pool_text FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access image pool" ON public.quiz_pool_image FOR ALL USING (true) WITH CHECK (true);
