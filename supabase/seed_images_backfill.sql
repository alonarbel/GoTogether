-- GoTogether — backfill seed cards with keyword-matched photos (LoremFlickr)
-- Run in Supabase SQL Editor. Replaces images on the 13 active seed cards.

delete from public.card_images where card_id in ('cccccccc-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000004', 'cccccccc-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000004', 'dddddddd-0000-0000-0000-000000000005', 'dddddddd-0000-0000-0000-000000000006', 'dddddddd-0000-0000-0000-000000000007', 'dddddddd-0000-0000-0000-000000000008');

insert into public.card_images (card_id, url, position) values
  ('cccccccc-0000-0000-0000-000000000001', 'https://loremflickr.com/1200/800/desert?lock=86613', 0),
  ('cccccccc-0000-0000-0000-000000000002', 'https://loremflickr.com/1200/800/cycling?lock=3461', 0),
  ('cccccccc-0000-0000-0000-000000000003', 'https://loremflickr.com/1200/800/jerusalem?lock=46987', 0),
  ('cccccccc-0000-0000-0000-000000000004', 'https://loremflickr.com/1200/800/scuba,diving?lock=94205', 0),
  ('cccccccc-0000-0000-0000-000000000005', 'https://loremflickr.com/1200/800/streetfood,market?lock=99882', 0),
  ('dddddddd-0000-0000-0000-000000000001', 'https://loremflickr.com/1200/800/hiking?lock=40342', 0),
  ('dddddddd-0000-0000-0000-000000000002', 'https://loremflickr.com/1200/800/haifa?lock=12258', 0),
  ('dddddddd-0000-0000-0000-000000000003', 'https://loremflickr.com/1200/800/surfing?lock=16535', 0),
  ('dddddddd-0000-0000-0000-000000000004', 'https://loremflickr.com/1200/800/pottery?lock=41068', 0),
  ('dddddddd-0000-0000-0000-000000000005', 'https://loremflickr.com/1200/800/cycling?lock=38388', 0),
  ('dddddddd-0000-0000-0000-000000000006', 'https://loremflickr.com/1200/800/hiking?lock=78428', 0),
  ('dddddddd-0000-0000-0000-000000000007', 'https://loremflickr.com/1200/800/streetfood,market?lock=8356', 0),
  ('dddddddd-0000-0000-0000-000000000008', 'https://loremflickr.com/1200/800/yoga?lock=83483', 0);
