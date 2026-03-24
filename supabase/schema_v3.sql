-- =================================================================
-- Nuave Database Schema v3
-- Architecture: org → workspace → brand hierarchy
-- Replaces: schema_v2.sql (abandoned — zero user data)
-- Date: 2026-03-24
-- =================================================================

-- =================================================================
-- STEP 1: Drop existing objects (dependency order)
-- =================================================================

DROP FUNCTION IF EXISTS deduct_credits(uuid, integer);
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS refund_credits(uuid, integer);
DROP FUNCTION IF EXISTS refund_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS claim_welcome_credits(uuid, uuid);
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS user_workspaces() CASCADE;
DROP FUNCTION IF EXISTS user_brands() CASCADE;
DROP FUNCTION IF EXISTS effective_role(uuid) CASCADE;

DROP TABLE IF EXISTS public.content_assets      CASCADE;
DROP TABLE IF EXISTS public.blog_posts          CASCADE;
DROP TABLE IF EXISTS public.recommendations     CASCADE;
DROP TABLE IF EXISTS public.competitor_snapshots CASCADE;
DROP TABLE IF EXISTS public.competitor_analysis CASCADE;
DROP TABLE IF EXISTS public.audit_results       CASCADE;
DROP TABLE IF EXISTS public.audits              CASCADE;
DROP TABLE IF EXISTS public.brand_competitors   CASCADE;
DROP TABLE IF EXISTS public.prompts             CASCADE;
DROP TABLE IF EXISTS public.topics              CASCADE;
DROP TABLE IF EXISTS public.brands              CASCADE;
DROP TABLE IF EXISTS public.projects            CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.workspace_members   CASCADE;
DROP TABLE IF EXISTS public.workspaces          CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations       CASCADE;
DROP TABLE IF EXISTS public.users               CASCADE;

-- =================================================================
-- STEP 2: Create tables
-- =================================================================

-- ── USERS ─────────────────────────────────────────────────────────
-- Mirrors auth.users. Profile only — no credits here (lives on org).
CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ORGANIZATIONS ─────────────────────────────────────────────────
-- Billing root. One per company. Auto-created on signup.
-- SME users: named "{first_name}'s Account", invisible in UI.
-- Enterprise users: visible, renameable, multi-workspace.
CREATE TABLE public.organizations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  slug             TEXT        NOT NULL UNIQUE,
  plan             TEXT        NOT NULL DEFAULT 'free',  -- free | pro | enterprise
  credits_balance  INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT plan_values CHECK (plan IN ('free', 'pro', 'enterprise')),
  CONSTRAINT credits_non_negative CHECK (credits_balance >= 0)
);

-- ── ORGANIZATION MEMBERS ──────────────────────────────────────────
-- Org-level RBAC. A user can belong to multiple orgs.
-- One record per user per org. Owner cannot be demoted via UI.
CREATE TABLE public.organization_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'member',  -- owner | admin | member | viewer
  invited_by  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, user_id),
  CONSTRAINT org_role_values CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- ── WORKSPACES ────────────────────────────────────────────────────
-- Team boundary within an org.
-- Auto-created as 'My Workspace' for SME users on signup.
-- Enterprise orgs create multiple (e.g. "Brand Team", "Agency Clients").
CREATE TABLE public.workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL DEFAULT 'default',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, slug)
);

-- ── WORKSPACE MEMBERS ─────────────────────────────────────────────
-- Maps org members into a specific workspace with a scoped role.
-- user_id MUST already exist in organization_members for the same org.
-- Org owner/admin always overrides workspace role (see effective_role()).
CREATE TABLE public.workspace_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member',  -- admin | member | viewer
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (workspace_id, user_id),
  CONSTRAINT workspace_role_values CHECK (role IN ('admin', 'member', 'viewer'))
);

-- ── BRANDS ───────────────────────────────────────────────────────
-- One brand being tracked. Renamed from 'projects'.
-- competitors and topics are now their own tables.
-- onboarding_completed_at gates the free credit claim.
CREATE TABLE public.brands (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by               UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  name                     TEXT        NOT NULL,
  website_url              TEXT,
  language                 TEXT        NOT NULL DEFAULT 'id',
  company_overview         TEXT,
  differentiators          TEXT[],
  industry                 TEXT,
  target_audience          TEXT,
  onboarding_completed_at  TIMESTAMPTZ,  -- set when profile is complete; gates free credit claim
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── TOPICS ───────────────────────────────────────────────────────
-- Content strategy pillars for a brand.
-- Extracted from the old projects.topics JSONB column.
-- Prompts can optionally belong to a topic (nullable topic_id = uncategorized).
CREATE TABLE public.topics (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  description    TEXT,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (brand_id, name)
);

-- ── PROMPTS ──────────────────────────────────────────────────────
-- Questions run against AI models during an audit.
-- topic_id is nullable — NULL means uncategorized (no sentinel row).
CREATE TABLE public.prompts (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  topic_id                UUID        REFERENCES public.topics(id) ON DELETE SET NULL,  -- nullable = uncategorized
  prompt_text             TEXT        NOT NULL,
  stage                   TEXT,                     -- awareness | consideration | decision
  language                TEXT        NOT NULL DEFAULT 'id',
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  is_edited               BOOLEAN     NOT NULL DEFAULT false,
  display_order           INTEGER     NOT NULL DEFAULT 0,
  core_keyword            TEXT,
  demand_tier             TEXT        NOT NULL DEFAULT 'medium',
  search_volume           INTEGER,
  search_volume_range     TEXT,
  competition_level       TEXT,
  cpc_micros              BIGINT,
  keyword_data_fetched_at TIMESTAMPTZ,
  archived_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── BRAND COMPETITORS ────────────────────────────────────────────
-- Known competitors for a brand.
-- Extracted from the old projects.competitors TEXT[] column.
-- Referenced by FK in competitor_snapshots (no more loose text matching).
CREATE TABLE public.brand_competitors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  website_url  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (brand_id, name)
);

-- ── AUDITS ───────────────────────────────────────────────────────
-- A measurement event. Captures brand visibility at a point in time.
-- Sits at brand level — it is the "heartbeat reading", not a container.
-- Recommendations and competitors are independent of any single audit.
CREATE TABLE public.audits (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             UUID         NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_by           UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  status               TEXT         NOT NULL DEFAULT 'pending',  -- pending | running | complete | failed
  visibility_score     NUMERIC(5,2),                              -- 0.00–100.00
  total_prompts        INTEGER,
  brand_mention_count  INTEGER,
  credits_used         INTEGER      NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,

  CONSTRAINT audit_status_values CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  CONSTRAINT score_range CHECK (visibility_score IS NULL OR (visibility_score >= 0 AND visibility_score <= 100))
);

-- ── AUDIT RESULTS ────────────────────────────────────────────────
-- Per-prompt results from a single audit run.
-- prompt_text is denormalized for historical accuracy
-- (prompt may be edited after the audit ran; prompt_id set to NULL preserves history).
CREATE TABLE public.audit_results (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id            UUID        NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  prompt_id           UUID        REFERENCES public.prompts(id) ON DELETE SET NULL,  -- SET NULL preserves history
  prompt_text         TEXT,           -- denormalized snapshot at time of audit
  ai_response         TEXT,
  ai_model            TEXT,           -- which model produced this result
  brand_mentioned     BOOLEAN     NOT NULL DEFAULT false,
  mention_context     TEXT,
  mention_sentiment   TEXT,           -- positive | neutral | negative
  competitor_mentions TEXT[],
  position_rank       INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── COMPETITOR SNAPSHOTS ─────────────────────────────────────────
-- Per-audit competitor performance data.
-- Renamed from competitor_analysis. Uses FK to brand_competitors.
-- competitor_name is denormalized — preserved if the competitor is later removed.
CREATE TABLE public.competitor_snapshots (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id           UUID         NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  competitor_id      UUID         REFERENCES public.brand_competitors(id) ON DELETE SET NULL,
  competitor_name    TEXT         NOT NULL,    -- denormalized snapshot
  mention_count      INTEGER      NOT NULL DEFAULT 0,
  mention_frequency  NUMERIC(5,4),
  avg_position       NUMERIC(5,2),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── RECOMMENDATIONS ──────────────────────────────────────────────
-- Brand-level persistent backlog. NOT tied to a single audit.
-- source_audit_id = audit that first identified this gap.
-- last_seen_audit_id = most recent audit where this gap was still present.
--
-- Upsert key (handled in API layer): (brand_id, type, page_target)
-- using IS NOT DISTINCT FROM for nullable page_target.
--
-- Status lifecycle:
--   open → applied    (user implemented it)
--   open → dismissed  (user chose to ignore)
--   applied → resolved (next audit confirms gap is closed)
--   resolved → open   (regression: gap reappears in later audit)
--   dismissed → open  (user changes mind)
CREATE TABLE public.recommendations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id            UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  source_audit_id     UUID        REFERENCES public.audits(id) ON DELETE SET NULL,
  last_seen_audit_id  UUID        REFERENCES public.audits(id) ON DELETE SET NULL,
  type                TEXT,       -- technical | web_copy | content
  subtype             TEXT,       -- technical→(meta|schema|structure) | content→(blog|page)
  priority            TEXT,       -- high | medium | low
  title               TEXT        NOT NULL,
  description         TEXT,
  page_target         TEXT,       -- nullable — some recs apply to whole brand, not a specific page
  suggested_copy      TEXT,
  status              TEXT        NOT NULL DEFAULT 'open',
  applied_at          TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ,
  credits_used        INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT recommendation_status_values CHECK (status IN ('open', 'applied', 'dismissed', 'resolved')),
  CONSTRAINT recommendation_type_values   CHECK (type IN ('technical', 'web_copy', 'content'))
);

-- ── CONTENT ASSETS ───────────────────────────────────────────────
-- First-class content deliverables. Renamed and expanded from blog_posts.
-- References a recommendation as origin but has its own lifecycle.
-- published_url lets us track if the content got indexed by AI.
CREATE TABLE public.content_assets (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                 UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  origin_recommendation_id UUID        REFERENCES public.recommendations(id) ON DELETE SET NULL,
  created_by               UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  type                     TEXT        NOT NULL DEFAULT 'blog_post',
  title                    TEXT,
  slug                     TEXT,
  content                  TEXT,
  meta_description         TEXT,
  target_query             TEXT,
  status                   TEXT        NOT NULL DEFAULT 'draft',  -- draft | published | indexed
  published_url            TEXT,
  credits_used             INTEGER     NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT content_type_values   CHECK (type   IN ('blog_post', 'page_copy', 'meta_description', 'schema_markup')),
  CONSTRAINT content_status_values CHECK (status IN ('draft', 'published', 'indexed'))
);

-- ── CREDIT TRANSACTIONS ──────────────────────────────────────────
-- Org-scoped credit ledger. Every debit and credit is recorded here.
-- actioned_by = the user who triggered the transaction.
-- audit_id = which audit consumed the credits (nullable for purchases/bonuses).
CREATE TABLE public.credit_transactions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actioned_by              UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  audit_id                 UUID        REFERENCES public.audits(id) ON DELETE SET NULL,
  type                     TEXT        NOT NULL,  -- purchase | deduction | bonus | refund
  amount                   INTEGER     NOT NULL,  -- positive = credit added, negative = deducted
  balance_after            INTEGER,
  description              TEXT,
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT transaction_type_values CHECK (type IN ('purchase', 'deduction', 'bonus', 'refund'))
);

-- =================================================================
-- STEP 3: Indexes
-- =================================================================

-- Organization access patterns
CREATE INDEX idx_org_members_user_id      ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org_id       ON public.organization_members(org_id);

-- Workspace access patterns
CREATE INDEX idx_workspaces_org_id        ON public.workspaces(org_id);
CREATE INDEX idx_ws_members_user_id       ON public.workspace_members(user_id);
CREATE INDEX idx_ws_members_workspace_id  ON public.workspace_members(workspace_id);

-- Brand access patterns
CREATE INDEX idx_brands_workspace_id      ON public.brands(workspace_id);

-- Topic access patterns
CREATE INDEX idx_topics_brand_id          ON public.topics(brand_id);

-- Prompt access patterns
CREATE INDEX idx_prompts_brand_id         ON public.prompts(brand_id);
CREATE INDEX idx_prompts_topic_id         ON public.prompts(topic_id);

-- Competitor access patterns
CREATE INDEX idx_brand_competitors_brand_id ON public.brand_competitors(brand_id);

-- Audit access patterns
CREATE INDEX idx_audits_brand_id          ON public.audits(brand_id);
CREATE INDEX idx_audits_status            ON public.audits(status);
CREATE INDEX idx_audits_created_by        ON public.audits(created_by);

-- Audit result access patterns
CREATE INDEX idx_audit_results_audit_id   ON public.audit_results(audit_id);
CREATE INDEX idx_audit_results_prompt_id  ON public.audit_results(prompt_id);

-- Competitor snapshot access patterns
CREATE INDEX idx_competitor_snaps_audit_id       ON public.competitor_snapshots(audit_id);
CREATE INDEX idx_competitor_snaps_competitor_id  ON public.competitor_snapshots(competitor_id);

-- Recommendation access patterns
CREATE INDEX idx_recommendations_brand_id          ON public.recommendations(brand_id);
CREATE INDEX idx_recommendations_status            ON public.recommendations(status);
CREATE INDEX idx_recommendations_source_audit_id   ON public.recommendations(source_audit_id);
CREATE INDEX idx_recommendations_last_seen_audit_id ON public.recommendations(last_seen_audit_id);

-- Content asset access patterns
CREATE INDEX idx_content_assets_brand_id                 ON public.content_assets(brand_id);
CREATE INDEX idx_content_assets_origin_recommendation_id ON public.content_assets(origin_recommendation_id);

-- Credit transaction access patterns
CREATE INDEX idx_credit_txns_org_id       ON public.credit_transactions(org_id);
CREATE INDEX idx_credit_txns_actioned_by  ON public.credit_transactions(actioned_by);
CREATE INDEX idx_credit_txns_audit_id     ON public.credit_transactions(audit_id);

-- =================================================================
-- STEP 4: RLS Helper Functions
-- =================================================================
-- These functions are used inside RLS policies to avoid deep
-- chain JOINs being re-evaluated per row. SECURITY DEFINER
-- allows them to bypass RLS on membership tables themselves
-- (no circular dependency).

-- Returns all workspace IDs the current user has access to.
-- Includes workspaces where user is a direct member OR
-- where user is an org owner/admin (implicit full access).
CREATE OR REPLACE FUNCTION public.user_workspaces()
RETURNS TABLE(workspace_id UUID) AS $$
  SELECT w.id
  FROM public.workspaces w
  WHERE
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.org_id = w.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns all brand IDs the current user has access to.
CREATE OR REPLACE FUNCTION public.user_brands()
RETURNS TABLE(brand_id UUID) AS $$
  SELECT b.id
  FROM public.brands b
  WHERE b.workspace_id IN (SELECT workspace_id FROM public.user_workspaces());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns all org IDs the current user belongs to.
CREATE OR REPLACE FUNCTION public.user_orgs()
RETURNS TABLE(org_id UUID) AS $$
  SELECT om.org_id
  FROM public.organization_members om
  WHERE om.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the effective role for the current user in a given workspace.
-- Used by API routes for permission checks (not used in RLS directly).
-- Org owner/admin always overrides workspace-level role.
CREATE OR REPLACE FUNCTION public.effective_role(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_org_role       TEXT;
  v_workspace_role TEXT;
BEGIN
  SELECT om.role INTO v_org_role
  FROM public.workspaces w
  JOIN public.organization_members om ON om.org_id = w.org_id AND om.user_id = auth.uid()
  WHERE w.id = p_workspace_id;

  SELECT wm.role INTO v_workspace_role
  FROM public.workspace_members wm
  WHERE wm.workspace_id = p_workspace_id AND wm.user_id = auth.uid();

  IF v_org_role IN ('owner', 'admin') THEN
    RETURN v_org_role;
  END IF;

  RETURN COALESCE(v_workspace_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =================================================================
-- STEP 5: Business Logic Functions
-- =================================================================

-- Atomic credit deduction. Returns new balance, or -1 if insufficient.
-- Credits live on organizations, not users.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_org_id      UUID,
  p_amount      INTEGER,
  p_actioned_by UUID,
  p_audit_id    UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Audit credit deduction'
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.organizations
  SET    credits_balance = credits_balance - p_amount,
         updated_at = now()
  WHERE  id = p_org_id
    AND  credits_balance >= p_amount
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN -1;  -- Insufficient credits
  END IF;

  INSERT INTO public.credit_transactions
    (org_id, actioned_by, audit_id, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, p_audit_id, 'deduction', -p_amount, v_new_balance, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit refund. Returns new balance, or -1 if org not found.
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_org_id      UUID,
  p_amount      INTEGER,
  p_actioned_by UUID,
  p_audit_id    UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Credit refund'
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.organizations
  SET    credits_balance = credits_balance + p_amount,
         updated_at = now()
  WHERE  id = p_org_id
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  INSERT INTO public.credit_transactions
    (org_id, actioned_by, audit_id, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, p_audit_id, 'refund', p_amount, v_new_balance, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim welcome credits. Idempotent — can only succeed once per org.
-- Returns new balance, -1 if org not found, -2 if already claimed.
-- Called by POST /api/credits/claim-welcome after eligibility check.
-- Eligibility (brand profile complete) is checked in the API layer.
CREATE OR REPLACE FUNCTION public.claim_welcome_credits(
  p_org_id      UUID,
  p_actioned_by UUID
) RETURNS INTEGER AS $$
DECLARE
  v_already_claimed BOOLEAN;
  v_new_balance     INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE  org_id = p_org_id
      AND  type = 'bonus'
      AND  description = 'Welcome audit credit'
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN -2;  -- Already claimed
  END IF;

  UPDATE public.organizations
  SET    credits_balance = credits_balance + 10,
         updated_at = now()
  WHERE  id = p_org_id
  RETURNING credits_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  INSERT INTO public.credit_transactions
    (org_id, actioned_by, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, 'bonus', 10, v_new_balance, 'Welcome audit credit');

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- STEP 6: Signup Trigger
-- =================================================================
-- On new auth.users row: create profile → org → workspace → memberships.
-- All in one atomic transaction. Zero credits on signup.
-- Credits are granted via claim_welcome_credits() after profile completion.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id   UUID    := gen_random_uuid();
  v_ws_id    UUID    := gen_random_uuid();
  v_name     TEXT    := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_org_name TEXT;
  v_org_slug TEXT;
BEGIN
  -- Derive org name and unique slug
  v_org_name := v_name || '''s Account';
  v_org_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'))
                || '-' || substring(v_org_id::text, 1, 8);

  -- 1. User profile
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, v_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Organization (0 credits — claimed separately)
  INSERT INTO public.organizations (id, name, slug, plan, credits_balance)
  VALUES (v_org_id, v_org_name, v_org_slug, 'free', 0);

  -- 3. Default workspace
  INSERT INTO public.workspaces (id, org_id, name, slug)
  VALUES (v_ws_id, v_org_id, 'My Workspace', 'default');

  -- 4. Org membership (owner)
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (v_org_id, NEW.id, 'owner');

  -- 5. Workspace membership (admin)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_ws_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- STEP 7: Row Level Security
-- =================================================================

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_competitors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions   ENABLE ROW LEVEL SECURITY;

-- ── users ─────────────────────────────────────────────────────────
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── organizations ─────────────────────────────────────────────────
CREATE POLICY "orgs_select_member"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT org_id FROM public.user_orgs()));

CREATE POLICY "orgs_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ── organization_members ──────────────────────────────────────────
CREATE POLICY "org_members_select_same_org"
  ON public.organization_members FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs()));

CREATE POLICY "org_members_insert_admin"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_update_owner"
  ON public.organization_members FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "org_members_delete_admin"
  ON public.organization_members FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ── workspaces ────────────────────────────────────────────────────
CREATE POLICY "workspaces_select_member"
  ON public.workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM public.user_workspaces()));

CREATE POLICY "workspaces_insert_org_admin"
  ON public.workspaces FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspaces_update_org_admin"
  ON public.workspaces FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspaces_delete_org_admin"
  ON public.workspaces FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ── workspace_members ─────────────────────────────────────────────
CREATE POLICY "ws_members_select_same_workspace"
  ON public.workspace_members FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM public.user_workspaces()));

CREATE POLICY "ws_members_insert_admin"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.effective_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "ws_members_update_admin"
  ON public.workspace_members FOR UPDATE
  USING (public.effective_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "ws_members_delete_admin"
  ON public.workspace_members FOR DELETE
  USING (public.effective_role(workspace_id) IN ('owner', 'admin'));

-- ── brands ────────────────────────────────────────────────────────
CREATE POLICY "brands_select_member"
  ON public.brands FOR SELECT
  USING (id IN (SELECT brand_id FROM public.user_brands()));

CREATE POLICY "brands_insert_member"
  ON public.brands FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.user_workspaces()));

CREATE POLICY "brands_update_member"
  ON public.brands FOR UPDATE
  USING (id IN (SELECT brand_id FROM public.user_brands()));

CREATE POLICY "brands_delete_admin"
  ON public.brands FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.user_workspaces()
    )
    AND public.effective_role(workspace_id) IN ('owner', 'admin')
  );

-- ── topics ────────────────────────────────────────────────────────
CREATE POLICY "topics_all_via_brand"
  ON public.topics FOR ALL
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── prompts ───────────────────────────────────────────────────────
CREATE POLICY "prompts_all_via_brand"
  ON public.prompts FOR ALL
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── brand_competitors ─────────────────────────────────────────────
CREATE POLICY "brand_competitors_all_via_brand"
  ON public.brand_competitors FOR ALL
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── audits ────────────────────────────────────────────────────────
CREATE POLICY "audits_select_member"
  ON public.audits FOR SELECT
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()));

CREATE POLICY "audits_insert_member"
  ON public.audits FOR INSERT
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- UPDATE and DELETE are server-only (service role). No client policies.

-- ── audit_results ─────────────────────────────────────────────────
-- Read-only for clients. Inserted by service role only.
CREATE POLICY "audit_results_select_via_brand"
  ON public.audit_results FOR SELECT
  USING (
    audit_id IN (
      SELECT id FROM public.audits
      WHERE brand_id IN (SELECT brand_id FROM public.user_brands())
    )
  );

-- ── competitor_snapshots ──────────────────────────────────────────
-- Read-only for clients. Inserted by service role only.
CREATE POLICY "competitor_snaps_select_via_brand"
  ON public.competitor_snapshots FOR SELECT
  USING (
    audit_id IN (
      SELECT id FROM public.audits
      WHERE brand_id IN (SELECT brand_id FROM public.user_brands())
    )
  );

-- ── recommendations ───────────────────────────────────────────────
CREATE POLICY "recommendations_select_via_brand"
  ON public.recommendations FOR SELECT
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- Status updates (applied/dismissed) are allowed by members.
-- Full INSERT/DELETE is server-only (service role).
CREATE POLICY "recommendations_update_status_member"
  ON public.recommendations FOR UPDATE
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── content_assets ────────────────────────────────────────────────
CREATE POLICY "content_assets_all_via_brand"
  ON public.content_assets FOR ALL
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()))
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── credit_transactions ───────────────────────────────────────────
-- Members can read their org's transactions. All writes via functions only.
CREATE POLICY "credit_txns_select_org_member"
  ON public.credit_transactions FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs()));

-- =================================================================
-- STEP 8: Reload PostgREST schema cache
-- =================================================================

NOTIFY pgrst, 'reload schema';
