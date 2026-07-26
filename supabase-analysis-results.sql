-- Drop and recreate analysis_results with richer structure
drop table if exists public.analysis_results;

create table public.analysis_results (
  user_id         uuid primary key references auth.users(id) on delete cascade,

  -- What was analyzed
  content_type    text not null check (content_type in ('text', 'link', 'image')),
  subject         text,               -- the URL, text snippet, or 'uploaded image'

  -- Summary (shown in extension card)
  ai_probability  integer not null default 50,
  verdict         text,               -- e.g. "Likely AI-generated"
  summary_flags   text[] default '{}',-- short signal chips
  summary_reason  text,               -- 1-2 sentence quick explanation

  -- Deep report (shown in web app More Details)
  deep_analysis   jsonb,              -- full structured deep report
  cross_checks    jsonb,              -- cross-referenced evidence points
  confidence      text,               -- 'high' | 'medium' | 'low'

  analyzed_at     timestamptz default now()
);

alter table public.analysis_results enable row level security;

create policy "Users can read own result"
  on public.analysis_results for select
  using (auth.uid() = user_id);

create policy "Users can upsert own result"
  on public.analysis_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update own result"
  on public.analysis_results for update
  using (auth.uid() = user_id);
