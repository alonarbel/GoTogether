-- Add status column to travel_cards (active / cancelled)
ALTER TABLE public.travel_cards
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'cancelled'));

-- Mark cards as cancelled (not deleted) when min-participant deadline passes.
-- SECURITY DEFINER bypasses RLS so any authenticated user can trigger this.
CREATE OR REPLACE FUNCTION cleanup_expired_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE travel_cards
  SET status = 'cancelled'
  WHERE min_deadline IS NOT NULL
    AND min_deadline < CURRENT_DATE
    AND status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_cards() TO anon, authenticated;
