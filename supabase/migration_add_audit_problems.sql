-- =================================================================
-- Migration: Add audit_problems table + problem_id FK on recommendations
-- Phase 1 of problem-anchored recommendations system
-- Date: 2026-03-26
-- =================================================================

-- ── 1. Create audit_problems table ──────────────────────────────
CREATE TABLE public.audit_problems (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id            UUID        NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  audit_result_id     UUID        REFERENCES public.audit_results(id) ON DELETE SET NULL,
  brand_id            UUID        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  problem_key         TEXT        NOT NULL,  -- {sha256_12(prompt_text)}::{problem_type}
  severity            TEXT,       -- high | medium | low
  problem_type        TEXT,       -- e.g. missing_mention, weak_context, competitor_dominance
  title               TEXT,
  description         TEXT,
  status              TEXT        NOT NULL DEFAULT 'unresolved',
  first_seen_audit_id UUID        REFERENCES public.audits(id) ON DELETE SET NULL,
  last_seen_audit_id  UUID        REFERENCES public.audits(id) ON DELETE SET NULL,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT audit_problem_severity_values CHECK (severity IN ('high', 'medium', 'low')),
  CONSTRAINT audit_problem_status_values   CHECK (status IN ('unresolved', 'in_progress', 'resolved')),
  CONSTRAINT uq_brand_problem_key          UNIQUE (brand_id, problem_key)
);

-- ── 2. Add problem_id FK to recommendations ────────────────────
ALTER TABLE public.recommendations
  ADD COLUMN problem_id UUID REFERENCES public.audit_problems(id) ON DELETE SET NULL;

-- ── 3. Enable RLS ──────────────────────────────────────────────
ALTER TABLE public.audit_problems ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies ────────────────────────────────────────────
CREATE POLICY "audit_problems_select_via_brand"
  ON public.audit_problems FOR SELECT
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()));

CREATE POLICY "audit_problems_insert_via_brand"
  ON public.audit_problems FOR INSERT
  WITH CHECK (brand_id IN (SELECT brand_id FROM public.user_brands()));

CREATE POLICY "audit_problems_update_status_member"
  ON public.audit_problems FOR UPDATE
  USING (brand_id IN (SELECT brand_id FROM public.user_brands()));

-- ── 5. Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_audit_problems_audit_id            ON public.audit_problems(audit_id);
CREATE INDEX idx_audit_problems_audit_result_id     ON public.audit_problems(audit_result_id);
CREATE INDEX idx_audit_problems_brand_id            ON public.audit_problems(brand_id);
CREATE INDEX idx_audit_problems_status              ON public.audit_problems(status);
CREATE INDEX idx_audit_problems_first_seen_audit_id ON public.audit_problems(first_seen_audit_id);
CREATE INDEX idx_audit_problems_last_seen_audit_id  ON public.audit_problems(last_seen_audit_id);

-- ── 6. Reload PostgREST schema cache ───────────────────────────
NOTIFY pgrst, 'reload schema';
