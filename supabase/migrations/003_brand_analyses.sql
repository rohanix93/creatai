-- ============================================================
-- CREATAI :: V1.3 — Brand DNA synthesis reports
-- Brand-level analysis aggregating all the user's pulled content.
-- ============================================================

create table if not exists public.brand_analyses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,

  -- Step 1: DIAGNOSE
  niche text,
  summary text,
  audience_tags jsonb default '[]'::jsonb,       -- hashtag-style topic tags
  strengths jsonb default '[]'::jsonb,           -- [{title, evidence}]
  areas_to_improve jsonb default '[]'::jsonb,    -- [{title, evidence, fix}]

  -- Step 2: PAIN — specific underperforming asset IDs + why
  underperformers jsonb default '[]'::jsonb,     -- [{asset_id, title, views, reason}]

  -- Step 3: GROWTH POTENTIAL
  virality_score integer,                        -- 0-100
  growth_multiplier numeric,                     -- e.g. 4.5x projected
  growth_curve jsonb default '[]'::jsonb,        -- 30-day projection points

  -- Step 4: ASPIRATION (the bold target)
  target_followers bigint,
  target_date date,
  aspiration_statement text,

  -- Step 5: PLAN
  recommended_hooks jsonb default '[]'::jsonb,
  content_ideas jsonb default '[]'::jsonb,       -- [{title, hook, format, why}]
  posting_cadence text,

  -- Meta
  asset_count_at_analysis integer default 0,
  model text default 'gpt-4o-mini',
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brand_analyses_brand_idx
  on public.brand_analyses(brand_id, created_at desc);
create index if not exists brand_analyses_owner_idx
  on public.brand_analyses(owner_id, created_at desc);

alter table public.brand_analyses enable row level security;
drop policy if exists "select_own" on public.brand_analyses;
create policy "select_own" on public.brand_analyses for select using (auth.uid() = owner_id);
drop policy if exists "insert_own" on public.brand_analyses;
create policy "insert_own" on public.brand_analyses for insert with check (auth.uid() = owner_id);
drop policy if exists "update_own" on public.brand_analyses;
create policy "update_own" on public.brand_analyses for update using (auth.uid() = owner_id);
drop policy if exists "delete_own" on public.brand_analyses;
create policy "delete_own" on public.brand_analyses for delete using (auth.uid() = owner_id);
