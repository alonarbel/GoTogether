-- GoTogether Seed Data
-- Run in Supabase SQL Editor to add test cards with fictional users

-- ============================================================
-- Fake users in auth.users (required for FK constraint)
-- ============================================================
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role, aud)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'sarah.cohen@test.com',   '', now(), now(), now(), '{"full_name":"Sarah Cohen","phone":"+972501111111"}',   'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'david.levi@test.com',    '', now(), now(), now(), '{"full_name":"David Levi","phone":"+972522222222"}',    'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'maya.mizrahi@test.com',  '', now(), now(), now(), '{"full_name":"Maya Mizrahi","phone":"+972543333333"}',  'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'yossi.tour@test.com',    '', now(), now(), now(), '{"full_name":"Yossi Tours","phone":"+972504444444"}',   'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'noa.adventures@test.com','', now(), now(), now(), '{"full_name":"Noa Adventures","phone":"+972525555555"}','authenticated', 'authenticated')
on conflict (id) do nothing;

-- ============================================================
-- Profiles
-- ============================================================
insert into public.profiles (id, full_name, phone)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Sarah Cohen',    '+972501111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'David Levi',     '+972522222222'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Maya Mizrahi',   '+972543333333'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Yossi Tours',    '+972504444444'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Noa Adventures', '+972525555555')
on conflict (id) do update set full_name = excluded.full_name;

-- ============================================================
-- Travel Cards
-- ============================================================
insert into public.travel_cards (id, user_id, title, description, type, organizer_role, address, city, country, min_participants, max_participants, event_date, event_time, min_deadline, whatsapp_link, contact_info, phone)
values
  (
    'cccccccc-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'זריחה במצדה + ים המלח',
    'טיול יום כיף — נצפה בזריחה המדהימה ממצדה ואחר כך נרחץ בים המלח. יוצאים ב-3:00 לפנות בוקר. כולל הסעה חזרה.',
    'trip', 'traveler',
    'מצדה', 'ים המלח', 'ישראל',
    6, 15,
    (current_date + interval '10 days')::date,
    '03:00',
    (current_date + interval '7 days')::date,
    'https://chat.whatsapp.com/example1',
    'sarah.cohen@test.com',
    '+972501111111'
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000002',
    'טיול אופניים בנחל אלכסנדר',
    'רוכבים לאורך נחל אלכסנדר עד הים — כ-25 ק"מ בשביל נוח ויפהפה. מביאים אופניים אישיים. יש נקודת התחלה ב-Kfar Vitkin.',
    'sport', 'traveler',
    'כפר ויתקין', 'נתניה', 'ישראל',
    4, 10,
    (current_date + interval '5 days')::date,
    '08:00',
    (current_date + interval '3 days')::date,
    null,
    'david.levi@test.com',
    '+972522222222'
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000004',
    'סיור מודרך בעיר העתיקה ירושלים',
    'מדריך מוסמך עם 10 שנות ניסיון לוקח אתכם לסיור מעמיק בשכונות הנסתרות של הרובע היהודי והנוצרי. כולל כניסות לאתרים.',
    'attraction', 'guide',
    'שער יפו', 'ירושלים', 'ישראל',
    8, 20,
    (current_date + interval '14 days')::date,
    '09:00',
    (current_date + interval '12 days')::date,
    'https://chat.whatsapp.com/example3',
    'yossi.tour@test.com',
    '+972504444444'
  ),
  (
    'cccccccc-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000005',
    'סדנת צלילה לאגמיות — אילת',
    'סדנת צלילה מודרכת עבור מתחילים ומתקדמים. ציוד מסופק. נצלול לאגמיות ולשוניות האלמוגים הידועות של אילת.',
    'workshop', 'instructor',
    'חוף צלילה נפולי', 'אילת', 'ישראל',
    4, 8,
    (current_date + interval '21 days')::date,
    '10:00',
    (current_date + interval '18 days')::date,
    'https://chat.whatsapp.com/example4',
    'noa.adventures@test.com',
    '+972525555555'
  ),
  (
    'cccccccc-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000003',
    'ערב אוכל רחוב ב-Tel Aviv',
    'טיול קולינרי בשוק הכרמל — נטעם מ-8 דוכנים שונים עם המדריך שלנו. מתאים לאוהבי אוכל ורוצים להכיר אנשים חדשים!',
    'food', 'traveler',
    'שוק הכרמל', 'תל אביב', 'ישראל',
    5, 12,
    (current_date + interval '3 days')::date,
    '18:00',
    (current_date + interval '1 days')::date,
    null,
    'maya.mizrahi@test.com',
    '+972543333333'
  )
on conflict (id) do nothing;

-- ============================================================
-- Participants (some cards have existing participants)
-- ============================================================
insert into public.participants (card_id, user_id)
values
  -- מצדה: Sarah (יוצרת) + David + Maya
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003'),
  -- אופניים: David (יוצר) + Noa
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000005'),
  -- ירושלים: Yossi (מדריך) + 3 משתתפים
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000005'),
  -- צלילה: Noa (מדריכה) + 1 משתתף
  ('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002'),
  -- שוק הכרמל: Maya (יוצרת) + 2
  ('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005'),
  ('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004')
on conflict do nothing;
