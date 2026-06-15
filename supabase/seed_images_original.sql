-- GoTogether — images for the 5 active/upcoming original seed cards (cccccccc-0001..0005)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/luavngvjippsrqtjikkk/sql/new
-- Idempotent: on conflict do nothing. Past cards (0006..0008) intentionally skipped.

insert into public.card_images (card_id, url, position)
values
  -- מצדה + ים המלח
  ('cccccccc-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80', 0),
  ('cccccccc-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80', 1),

  -- אופניים נחל אלכסנדר
  ('cccccccc-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80', 0),
  ('cccccccc-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80', 1),

  -- סיור עיר עתיקה ירושלים
  ('cccccccc-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80', 0),
  ('cccccccc-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200&q=80', 1),

  -- צלילה אילת
  ('cccccccc-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 0),
  ('cccccccc-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1200&q=80', 1),

  -- אוכל רחוב שוק הכרמל
  ('cccccccc-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80', 0),
  ('cccccccc-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80', 1)
on conflict do nothing;
