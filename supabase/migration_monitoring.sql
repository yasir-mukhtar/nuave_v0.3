-- ============================================================
-- Migration: Daily Brand Monitoring
-- Adds monitoring toggle to brands, audit_type to audits
-- ============================================================

-- 1. Brands: monitoring columns
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS monitoring_enabled   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monitoring_paused_at TIMESTAMPTZ;

-- 2. Audits: distinguish manual vs monitoring
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS audit_type TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.audits
  ADD CONSTRAINT audit_type_values CHECK (audit_type IN ('manual', 'monitoring'));

-- 3. Partial index for fast cron query: "active monitoring brands"
CREATE INDEX IF NOT EXISTS idx_brands_monitoring_active
  ON public.brands(monitoring_enabled)
  WHERE monitoring_enabled = true AND monitoring_paused_at IS NULL;
