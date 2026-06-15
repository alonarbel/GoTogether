-- GoTogether — Future Israel cards seed (all with images)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/luavngvjippsrqtjikkk/sql/new
-- Reuses the fake users from seed.sql (run seed.sql first if profiles missing).
-- All cards are future-dated relative to current_date and each has >=1 card_image.

-- ============================================================
-- Travel Cards — future (Israel)
-- ============================================================
insert into public.travel_cards (id, user_id, title, description, type, organizer_role, address, city, country, lat, lng, min_participants, max_participants, event_date, event_time, min_deadline, whatsapp_link, contact_info, phone, tags)
values
  (
    'dddddddd-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'מסלול עין גדי + מעיינות',
    'טרק יום בשמורת עין גדי — נחל דוד, מפלים ובריכות טבעיות. מסלול בינוני, מתאים למשפחות וחבר׳ה. הסעה מירושלים זמינה.',
    'trip', 'traveler',
    'שמורת עין גדי', 'עין גדי', 'ישראל',
    31.4614, 35.3897,
    5, 14,
    (current_date + interval '9 days')::date, '07:30', (current_date + interval '6 days')::date,
    'https://chat.whatsapp.com/exampleA',
    'sarah.cohen@test.com', '+972501111111',
    ARRAY['טבע', 'מפלים', 'מדבר']
  ),
  (
    'dddddddd-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'סיור גגות ושווקים — חיפה',
    'נטייל בין הבהאים, ואדי ניסנאס והעיר התחתית. תערובת של נופים, ריחות ואוכל מקומי. סיור מודרך של 3 שעות.',
    'attraction', 'guide',
    'הגנים הבהאים', 'חיפה', 'ישראל',
    32.8156, 34.9885,
    6, 18,
    (current_date + interval '12 days')::date, '10:00', (current_date + interval '9 days')::date,
    'https://chat.whatsapp.com/exampleB',
    'yossi.tour@test.com', '+972504444444',
    ARRAY['עיר', 'תרבות', 'אוכל']
  ),
  (
    'dddddddd-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'גלישת גלים למתחילים — הרצליה',
    'שיעור גלישה ראשון על חוף הרצליה. כולל גלשן וחליפה. מדריכים מוסמכים, ים רגוע ובוקר מושלם להיכנס למים.',
    'sport', 'coach',
    'חוף הרצליה', 'הרצליה', 'ישראל',
    32.1663, 34.7956,
    4, 8,
    (current_date + interval '7 days')::date, '08:30', (current_date + interval '4 days')::date,
    null,
    'noa.adventures@test.com', '+972525555555',
    ARRAY['ים', 'גלישה', 'ספורט']
  ),
  (
    'dddddddd-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'סדנת קרמיקה ויין — תל אביב',
    'ערב יצירה רגוע — מעצבים כלי חרס על אובניים, עם כוס יין טוב ומוזיקה. כל החומרים כלולים, לא צריך ניסיון.',
    'workshop', 'organizer',
    'רחוב לוינסקי', 'תל אביב', 'ישראל',
    32.0566, 34.7747,
    5, 12,
    (current_date + interval '15 days')::date, '19:00', (current_date + interval '12 days')::date,
    'https://chat.whatsapp.com/exampleD',
    'maya.mizrahi@test.com', '+972543333333',
    ARRAY['יצירה', 'קרמיקה', 'ערב']
  ),
  (
    'dddddddd-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'מסע אופניים בכנרת — סובב ים',
    'רכיבה לאורך החוף המזרחי של הכנרת, עצירות לשחייה ולקפה. כ-40 ק"מ בקצב נינוח. מתאים לרוכבים עם ניסיון בסיסי.',
    'sport', 'traveler',
    'חוף דוגה', 'טבריה', 'ישראל',
    32.7922, 35.6400,
    4, 12,
    (current_date + interval '18 days')::date, '07:00', (current_date + interval '14 days')::date,
    null,
    'david.levi@test.com', '+972522222222',
    ARRAY['אופניים', 'כנרת', 'טבע']
  ),
  (
    'dddddddd-0000-0000-0000-000000000006',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'טיול כוכבים בנגב — מצפה רמון',
    'לילה במכתש רמון — תצפית כוכבים עם טלסקופ, סיפורי מדבר ופינת אש. כולל הסעה והדרכה אסטרונומית.',
    'trip', 'guide',
    'מצפה המכתש', 'מצפה רמון', 'ישראל',
    30.6097, 34.8014,
    6, 20,
    (current_date + interval '20 days')::date, '20:30', (current_date + interval '16 days')::date,
    'https://chat.whatsapp.com/exampleF',
    'yossi.tour@test.com', '+972504444444',
    ARRAY['מדבר', 'כוכבים', 'לילה']
  ),
  (
    'dddddddd-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'שוק האוכל של מחנה יהודה — ירושלים',
    'סיור טעימות בין הסמטאות של מחנה יהודה. 7 תחנות, מתוק ומלוח, עם הסיפורים מאחורי הדוכנים. בואו רעבים!',
    'food', 'traveler',
    'שוק מחנה יהודה', 'ירושלים', 'ישראל',
    31.7857, 35.2120,
    5, 12,
    (current_date + interval '6 days')::date, '17:30', (current_date + interval '3 days')::date,
    null,
    'maya.mizrahi@test.com', '+972543333333',
    ARRAY['אוכל', 'שוק', 'ירושלים']
  ),
  (
    'dddddddd-0000-0000-0000-000000000008',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'יוגה וזריחה בחוף בית ינאי',
    'מתחילים את היום עם יוגה על החוף מול הזריחה, נשימות וקצת מדיטציה. מזרנים מסופקים. סיום בתה צמחים חם.',
    'workshop', 'coach',
    'חוף בית ינאי', 'נתניה', 'ישראל',
    32.3947, 34.8616,
    4, 16,
    (current_date + interval '8 days')::date, '05:45', (current_date + interval '5 days')::date,
    null,
    'noa.adventures@test.com', '+972525555555',
    ARRAY['יוגה', 'ים', 'זריחה']
  )
on conflict (id) do nothing;

-- ============================================================
-- Card Images (known-good Unsplash URLs — every card gets images)
-- ============================================================
insert into public.card_images (card_id, url, position)
values
  ('dddddddd-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80', 1),

  ('dddddddd-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200&q=80', 1),

  ('dddddddd-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1200&q=80', 1),

  ('dddddddd-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80', 0),

  ('dddddddd-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80', 1),

  ('dddddddd-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80', 1),

  ('dddddddd-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=80', 0),

  ('dddddddd-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80', 0),
  ('dddddddd-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80', 1)
on conflict do nothing;

-- ============================================================
-- Participants (organizer auto-joins where role = traveler; add a few extras)
-- ============================================================
insert into public.participants (card_id, user_id)
values
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005'),
  ('dddddddd-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('dddddddd-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000004'),
  ('dddddddd-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000005')
on conflict do nothing;
