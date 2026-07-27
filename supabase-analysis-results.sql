-- Safe migration: create table if not exists, then add missing columns
-- Run this in Supabase SQL Editor

create table if not exists public.analysis_results (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  content_type    text not null default 'text',
  subject         text,
  ai_probability  integer not null default 50,
  analyzed_at     timestamptz default now()
);

-- Add factuality columns if they don't exist yet
alter table public.analysis_results
  add column if not exists verdict        text,
  add column if not exists summary_flags  text[] default '{}',
  add column if not exists summary_reason text,
  add column if not exists deep_analysis  jsonb,
  add column if not exists cross_checks   jsonb,
  add column if not exists confidence     text default 'medium',
  add column if not exists factuality_score integer,
  add column if not exists factual_claims  jsonb;

-- Enable RLS
alter table public.analysis_results enable row level security;

-- Policies (safe to re-run)
drop policy if exists "Users can read own result"   on public.analysis_results;
drop policy if exists "Users can upsert own result" on public.analysis_results;
drop policy if exists "Users can update own result" on public.analysis_results;

create policy "Users can read own result"
  on public.analysis_results for select
  using (auth.uid() = user_id);

create policy "Users can upsert own result"
  on public.analysis_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own result"
  on public.analysis_results for update
  using (auth.uid() = user_id);
