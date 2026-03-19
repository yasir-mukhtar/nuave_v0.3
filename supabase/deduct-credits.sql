-- Atomic credit deduction: checks balance and deducts in one operation.
-- Returns the new balance, or -1 if insufficient credits.
-- This prevents race conditions from concurrent audit submissions.

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

-- Refund credits: adds back credits on audit failure.
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
