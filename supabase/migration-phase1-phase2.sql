-- =============================================================
-- Nuave Migration: Phase 1 (Keyword Tiers) + Phase 2 (Google Ads Volume)
-- Run this entire script in Supabase SQL Editor (Dashboard → SQL)
-- =============================================================

-- 1. Prompts table — keyword volume columns
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS core_keyword TEXT,
  ADD COLUMN IF NOT EXISTS demand_tier TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS search_volume INTEGER,
  ADD COLUMN IF NOT EXISTS search_volume_range TEXT,
  ADD COLUMN IF NOT EXISTS competition_level TEXT,
  ADD COLUMN IF NOT EXISTS cpc_micros BIGINT,
  ADD COLUMN IF NOT EXISTS keyword_data_fetched_at TIMESTAMPTZ;

-- 2. Workspaces table — cached topics
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS topics JSONB;

-- 3. Atomic credit deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_user_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_balance;
END;
$$;

-- 4. Credit refund on audit failure
CREATE OR REPLACE FUNCTION refund_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits_balance = credits_balance + p_amount
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_balance;
END;
$$;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
