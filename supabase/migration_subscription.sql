-- Migration: Credits-based → Subscription-based model
-- Run this AFTER schema_v3.sql and migration_monitoring.sql

-- ============================================================
-- 1. Update plan constraint: free|pro|enterprise → free|starter|growth|agency
-- ============================================================

-- First set any existing pro/enterprise orgs to free (safety net)
UPDATE organizations SET plan = 'free' WHERE plan NOT IN ('free');

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS plan_values;
ALTER TABLE organizations ADD CONSTRAINT plan_values
  CHECK (plan IN ('free', 'starter', 'growth', 'agency'));

-- ============================================================
-- 2. Add subscription metadata columns
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_id       TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle          TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_started_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_start   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pending_plan           TEXT;

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS billing_cycle_values;
ALTER TABLE organizations ADD CONSTRAINT billing_cycle_values
  CHECK (billing_cycle IN ('monthly', 'annual'));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS subscription_status_values;
ALTER TABLE organizations ADD CONSTRAINT subscription_status_values
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'expired'));

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS pending_plan_values;
ALTER TABLE organizations ADD CONSTRAINT pending_plan_values
  CHECK (pending_plan IS NULL OR pending_plan IN ('free', 'starter', 'growth', 'agency'));

-- ============================================================
-- 3. Update audit_type to include monthly_auto
-- ============================================================

ALTER TABLE audits DROP CONSTRAINT IF EXISTS audit_type_values;
ALTER TABLE audits ADD CONSTRAINT audit_type_values
  CHECK (audit_type IN ('manual', 'monitoring', 'monthly_auto'));

-- ============================================================
-- 4. Billing events table (Midtrans webhook log)
-- ============================================================

CREATE TABLE IF NOT EXISTS billing_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type              TEXT NOT NULL,
  midtrans_order_id       TEXT,
  midtrans_transaction_id TEXT,
  payload                 JSONB NOT NULL DEFAULT '{}',
  processed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_txn
  ON billing_events(midtrans_transaction_id, event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_order
  ON billing_events(midtrans_order_id, event_type);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Org owners/admins can view their billing events
CREATE POLICY billing_events_select ON billing_events
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.user_orgs()));

-- Only service role can insert/update (webhook handler)
CREATE POLICY billing_events_service_insert ON billing_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY billing_events_service_update ON billing_events
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- 5. Refund requests table
-- ============================================================

CREATE TABLE IF NOT EXISTS refund_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by      UUID NOT NULL REFERENCES users(id),
  reason            TEXT,
  amount            INTEGER NOT NULL,        -- in IDR
  status            TEXT NOT NULL DEFAULT 'pending',
  midtrans_refund_id TEXT,
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT refund_status_values CHECK (status IN ('pending', 'approved', 'rejected', 'processed'))
);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY refund_requests_select ON refund_requests
  FOR SELECT USING (org_id IN (SELECT org_id FROM public.user_orgs()));

CREATE POLICY refund_requests_insert ON refund_requests
  FOR INSERT WITH CHECK (org_id IN (
    SELECT om.org_id FROM organization_members om
    WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
  ));

-- Only service role can update refund status
CREATE POLICY refund_requests_service_update ON refund_requests
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================
-- 6. Zero out credits (kept for metering, no longer gates features)
-- ============================================================

UPDATE organizations SET credits_balance = 0;

-- ============================================================
-- 7. Give existing users a 30-day grace period
-- ============================================================

UPDATE organizations
SET current_period_end = NOW() + INTERVAL '30 days'
WHERE current_period_end IS NULL;

-- ============================================================
-- 8. Drop the claim_welcome_credits function (no longer needed)
-- ============================================================

DROP FUNCTION IF EXISTS public.claim_welcome_credits(uuid, uuid);
