-- Deletes travel cards where the minimum-participant deadline has passed.
-- SECURITY DEFINER lets this run as the function owner, bypassing RLS so
-- it can delete any card regardless of who calls it.
CREATE OR REPLACE FUNCTION cleanup_expired_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM travel_cards
  WHERE min_deadline IS NOT NULL
    AND min_deadline < CURRENT_DATE;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_cards() TO anon, authenticated;
