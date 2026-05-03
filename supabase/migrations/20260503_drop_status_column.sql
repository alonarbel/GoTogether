-- Drop status column added in the soft-cancel approach (reverted to hard delete)
ALTER TABLE public.travel_cards DROP COLUMN IF EXISTS status;
