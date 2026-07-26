-- analysis_results table
-- One row per user — upserted on every new analysis, so old results are replaced.
-- This avoids putting long data in URLs and keeps the "More Details" page clean.

create table if not exists public.analysis_results (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  content_type  text not null check (content_type in ('text', 'link', 'image')),
  subject       text,                        -- the analyzed URL / text snippet / 'uploaded image'
  ai_probability integer not null default 50,
  summary       text,                        -- 1-sentence verdict shown in the extension card
  flags         text[] default '{}',         -- short signal strings
  reasoning     text,                        -- 2-3 sentence explanation
  deep_report   jsonb,                       -- full structured report for the web app
  analyzed_at   timestamptz default now()
);

-- Only the owner can read/write their own result
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

-- Service role bypasses RLS (used by the API route with service key)
