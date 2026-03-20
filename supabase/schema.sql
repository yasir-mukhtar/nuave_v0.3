-- =============================================================
-- Nuave Database Schema v2
-- Workspace → Project hierarchy
-- Run in Supabase SQL Editor on fresh DB
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- STEP 1: Drop existing tables + functions (dependency order)
-- =============================================================

DROP FUNCTION IF EXISTS deduct_credits(uuid, integer);
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS refund_credits(uuid, integer);
DROP FUNCTION IF EXISTS refund_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;
DROP TABLE IF EXISTS public.competitor_analysis CASCADE;
DROP TABLE IF EXISTS public.audit_results CASCADE;
DROP TABLE IF EXISTS public.audits CASCADE;
DROP TABLE IF EXISTS public.prompts CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =============================================================
-- STEP 2: Create tables
-- =============================================================

-- USERS (mirrors auth.users, extended)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  credits_balance INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WORKSPACES (billing/account container)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'smb',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PROJECTS (one brand being tracked)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  language TEXT DEFAULT 'id',
  company_overview TEXT,
  differentiators TEXT[],
  competitors TEXT[],
  industry TEXT,
  target_audience TEXT,
  topics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PROMPTS
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  topic TEXT,
  stage TEXT,
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  core_keyword TEXT,
  demand_tier TEXT DEFAULT 'medium',
  search_volume INTEGER,
  search_volume_range TEXT,
  competition_level TEXT,
  cpc_micros BIGINT,
  keyword_data_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AUDITS
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  visibility_score INTEGER,
  total_prompts INTEGER,
  brand_mention_count INTEGER,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- AUDIT RESULTS
CREATE TABLE public.audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id),
  prompt_text TEXT,
  ai_response TEXT,
  brand_mentioned BOOLEAN DEFAULT false,
  mention_context TEXT,
  mention_sentiment TEXT,
  competitor_mentions TEXT[],
  position_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COMPETITOR ANALYSIS
CREATE TABLE public.competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  competitor_name TEXT,
  mention_count INTEGER,
  mention_frequency FLOAT,
  avg_position FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RECOMMENDATIONS
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  priority TEXT,
  title TEXT,
  description TEXT,
  page_target TEXT,
  suggested_copy TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  slug TEXT,
  content TEXT,
  target_query TEXT,
  status TEXT DEFAULT 'draft',
  credits_used INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CREDIT TRANSACTIONS
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  description TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- STEP 3: Postgres functions (atomic credit operations)
-- =============================================================

-- Atomic credit deduction: checks balance, deducts, logs transaction.
-- Returns new balance, or -1 if insufficient credits.
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Audit credit deduction'
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits_balance = credits_balance - p_amount,
      updated_at = now()
  WHERE id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, description)
  VALUES (gen_random_uuid(), p_user_id, 'debit', -p_amount, new_balance, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Credit refund: adds credits back, logs transaction.
-- Returns new balance, or -1 if user not found.
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Audit failure refund'
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits_balance = credits_balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, description)
  VALUES (gen_random_uuid(), p_user_id, 'bonus', p_amount, new_balance, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- STEP 4: Row Level Security
-- =============================================================

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- WORKSPACES
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owner full access"
  ON public.workspaces FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PROJECTS (via workspace ownership)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project access via workspace"
  ON public.projects FOR ALL
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid())
  );

-- PROMPTS (via project → workspace chain)
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt access via project"
  ON public.prompts FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- AUDITS (via project → workspace chain)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit access via project"
  ON public.audits FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- AUDIT RESULTS (via audit → project → workspace chain)
ALTER TABLE public.audit_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit result access via audit"
  ON public.audit_results FOR ALL
  USING (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- COMPETITOR ANALYSIS (via audit chain)
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitor analysis access via audit"
  ON public.competitor_analysis FOR ALL
  USING (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- RECOMMENDATIONS (via audit chain)
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommendation access via audit"
  ON public.recommendations FOR ALL
  USING (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    audit_id IN (
      SELECT a.id FROM public.audits a
      JOIN public.projects p ON p.id = a.project_id
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- BLOG POSTS (via project chain)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog post access via project"
  ON public.blog_posts FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      WHERE w.user_id = auth.uid()
    )
  );

-- CREDIT TRANSACTIONS (read-only for users, service role inserts)
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================
-- STEP 5: auth.users → public.users sync trigger
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- STEP 6: Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
