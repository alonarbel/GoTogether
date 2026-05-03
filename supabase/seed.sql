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
  ('aaaaaaaa-0000-0000-0000-000000000005', 'noa.adventures@test.com','', now(), now(), now(), '{"full_name":"Noa Adventures","phone":"+972525555555"}','authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'gil.levy@test.com',      '', now(), now(), now(), '{"full_name":"Gil Levy","phone":"+972506666666"}',      'authenticated', 'authenticated')
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
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Noa Adventures', '+972525555555'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'Gil Levy',       '+972506666666')
on conflict (id) do update set full_name = excluded.full_name;

-- ============================================================
-- Travel Cards — active (upcoming)
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
    'workshop', 'organizer',
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
-- Travel Cards — past events organized by Gil Levy
-- (event_date in the past, minimum was reached)
-- ============================================================
insert into public.travel_cards (id, user_id, title, description, type, organizer_role, address, city, country, min_participants, max_participants, event_date, event_time, min_deadline, contact_info, phone, tags)
values
  (
    'cccccccc-0000-0000-0000-000000000006',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'טיול שבת בגליל העליון',
    'יום טיול מושלם בגליל — מפל בניאס, גשר בנות יעקב וסיום בשחייה בנחל חרמון. הגענו 5 אנשים ויצא מדהים!',
    'trip', 'traveler',
    'שמורת בניאס', 'קצרין', 'ישראל',
    4, 10,
    (current_date - interval '4 months')::date,
    '06:30',
    (current_date - interval '5 months')::date,
    'gil.levy@test.com', '+972506666666',
    ARRAY['גליל', 'טבע', 'מפלים']
  ),
  (
    'cccccccc-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'סדנת בישול אסיאתי בתל אביב',
    'ערב של טעמים — פד תאי, דאמפלינגס ורמן יפני ביתי. בישלנו יחד, אכלנו יחד. חוויה שלא תישכח.',
    'workshop', 'organizer',
    'שוק הכרמל', 'תל אביב', 'ישראל',
    5, 10,
    (current_date - interval '2 months')::date,
    '18:00',
    (current_date - interval '3 months')::date,
    'gil.levy@test.com', '+972506666666',
    ARRAY['אוכל', 'סדנה', 'בישול']
  ),
  (
    'cccccccc-0000-0000-0000-000000000008',
    'aaaaaaaa-0000-0000-0000-000000000006',
    'ריצת חצי מרתון — פארק הירקון',
    '21 ק"מ לאורך הירקון עם קבוצה נהדרת. קצב נוח, עצירות לשתייה ופינוק בסוף. כולם סיימו!',
    'sport', 'traveler',
    'פארק הירקון', 'תל אביב', 'ישראל',
    4, 15,
    (current_date - interval '5 weeks')::date,
    '07:00',
    (current_date - interval '6 weeks')::date,
    'gil.levy@test.com', '+972506666666',
    ARRAY['ריצה', 'ספורט', 'ירקון']
  )
on conflict (id) do nothing;

-- ============================================================
-- Participants (active cards)
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
  ('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000004'),
  -- גליל: Gil (יוצר) + 4
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000006'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000005'),
  -- בישול אסיאתי: Gil (יוצר) + 4
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000006'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000003'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000004'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000005'),
  -- ריצת ירקון: Gil (יוצר) + 3
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000006'),
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000004'),
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000005')
on conflict do nothing;

-- ============================================================
-- Reviews for Gil Levy's past events
-- ============================================================
insert into public.reviews (card_id, reviewer_id, card_rating, organizer_rating, comment)
values
  -- טיול גליל
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 5, 5, 'יום מושלם! גיל ידע לקחת אותנו למקומות הכי יפים. המפל היה עוצר נשימה ❤️'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000002', 5, 5, 'ארגון מעולה, נסיעה חלקה ואנשים מדהימים. חייב לבוא לטיול הבא של גיל!'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000003', 4, 5, 'אחד מהטיולים הכי טובים שהייתי בהם. גיל מנהיג מדהים, רגוע ומקצועי.'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000005', 5, 5, 'ממליצה בחום! המסלול מאתגר בדיוק במידה הנכונה והחברה היתה מעולה.'),
  -- סדנת בישול
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000002', 5, 5, 'שעות של כיף ואוכל טעים. גיל מסביר בסבלנות ויוצא ממש טעים! נרשמתי כבר לסדנה הבאה.'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000003', 5, 4, 'הפד תאי יצא הכי טעים שאכלתי. אווירה נהדרת, בישלנו בצחוק כל הערב 🍜'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000004', 4, 5, 'חוויה מיוחדת! רציתי ללמוד לבשל אסיאתי ויצא ממני שף אמיתי. תודה גיל!'),
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000005', 5, 5, 'המארגן הכי אדיב שפגשתי. הסדנה היתה מקצועית ומהנה מהרגע הראשון.'),
  -- ריצת ירקון
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 5, 5, 'סיימתי חצי מרתון לראשונה בחיי! גיל עודד אותי לאורך כל הדרך. חוויה שלא אשכח.'),
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000004', 4, 5, 'קצב נוח ונעים, הירקון יפה בבוקר. מסיימים עם ארוחת בוקר ביחד — מה יותר טוב?'),
  ('cccccccc-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000005', 5, 5, 'הריצה הראשונה שלי עם קבוצה — גיל יצר אווירה כל כך טובה שלא הרגשתי את הקילומטרים 😄')
on conflict (card_id, reviewer_id) do nothing;
