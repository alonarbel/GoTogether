-- Delete future travel cards where the minimum-participant deadline has passed.
-- Cards whose event_date is already in the past are kept as historical records.
-- SECURITY DEFINER bypasses RLS so any authenticated user can trigger this.
CREATE OR REPLACE FUNCTION cleanup_expired_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM travel_cards
  WHERE min_deadline IS NOT NULL
    AND min_deadline < CURRENT_DATE
    AND (event_date IS NULL OR event_date >= CURRENT_DATE);
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_cards() TO anon, authenticated;
