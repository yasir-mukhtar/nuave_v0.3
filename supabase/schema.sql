-- Enable required extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- USERS
create table if not exists public.users (
  id uuid primary key references auth.users (id),
  email text,
  full_name text,
  credits_balance integer default 10,
  created_at timestamptz default now()
);

-- WORKSPACES
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id),
  session_token text,
  brand_name text not null,
  website_url text not null,
  language text default 'en',
  company_overview text,
  differentiators text[],
  competitors text[],
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PROMPTS
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  prompt_text text not null,
  stage text check (stage in ('awareness', 'consideration', 'decision')),
  language text default 'en',
  is_active boolean default true,
  display_order integer,
  created_at timestamptz default now()
);

-- AUDITS
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'running', 'complete', 'failed')),
  visibility_score integer check (visibility_score between 0 and 100),
  total_prompts integer,
  brand_mention_count integer,
  credits_used integer default 10,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- AUDIT RESULTS
create table if not exists public.audit_results (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits (id) on delete cascade,
  prompt_id uuid references public.prompts (id),
  prompt_text text,
  ai_response text,
  brand_mentioned boolean default false,
  mention_context text,
  mention_sentiment text check (mention_sentiment in ('positive', 'neutral', 'negative')),
  competitor_mentions text[],
  position_rank integer,
  created_at timestamptz default now()
);

-- RECOMMENDATIONS
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits (id) on delete cascade,
  workspace_id uuid references public.workspaces (id),
  type text check (type in ('web_copy', 'meta', 'structure', 'content_gap')),
  priority text check (priority in ('high', 'medium', 'low')),
  title text,
  description text,
  current_copy text,
  suggested_copy text,
  credits_used integer default 1,
  created_at timestamptz default now()
);

-- BLOG POSTS
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits (id),
  workspace_id uuid references public.workspaces (id),
  prompt_id uuid references public.prompts (id),
  title text,
  slug text,
  content text,
  target_query text,
  status text default 'draft' check (status in ('draft', 'published')),
  published_url text,
  credits_used integer default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CREDIT TRANSACTIONS
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id),
  type text check (type in ('purchase', 'debit', 'bonus')),
  amount integer not null,
  balance_after integer,
  description text,
  stripe_payment_intent_id text,
  reference_id uuid,
  created_at timestamptz default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- USERS
alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users
  for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- WORKSPACES
alter table public.workspaces enable row level security;

create policy "Workspace owner select/update/delete"
  on public.workspaces
  for select, update, delete
  using (user_id = auth.uid());

create policy "Workspace owner insert"
  on public.workspaces
  for insert
  with check (user_id = auth.uid() or user_id is null);

-- PROMPTS (scoped through workspace ownership)
alter table public.prompts enable row level security;

create policy "Workspace owner access prompts"
  on public.prompts
  for all
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  );

-- AUDITS (scoped through workspace ownership)
alter table public.audits enable row level security;

create policy "Workspace owner access audits"
  on public.audits
  for all
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  );

-- AUDIT RESULTS (scoped through audit ownership)
alter table public.audit_results enable row level security;

create policy "Workspace owner access audit_results"
  on public.audit_results
  for all
  using (
    exists (
      select 1
      from public.audits a
      join public.workspaces w on w.id = a.workspace_id
      where a.id = audit_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.audits a
      join public.workspaces w on w.id = a.workspace_id
      where a.id = audit_id
        and w.user_id = auth.uid()
    )
  );

-- RECOMMENDATIONS (scoped through workspace ownership)
alter table public.recommendations enable row level security;

create policy "Workspace owner access recommendations"
  on public.recommendations
  for all
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  );

-- BLOG POSTS (scoped through workspace ownership)
alter table public.blog_posts enable row level security;

create policy "Workspace owner access blog_posts"
  on public.blog_posts
  for all
  using (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()
    )
  );

-- CREDIT TRANSACTIONS
alter table public.credit_transactions enable row level security;

create policy "Users can view own credit transactions"
  on public.credit_transactions
  for select
  using (user_id = auth.uid());

