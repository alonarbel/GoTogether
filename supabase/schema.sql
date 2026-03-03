-- GoTogether Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/luavngvjippsrqtjikkk/sql/new

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- Travel Cards
-- ============================================================
create table if not exists public.travel_cards (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  title            text not null,
  description      text not null default '',
  type             text not null default 'trip'
                     check (type in ('trip','attraction','workshop','sport','food','other')),
  organizer_role   text not null default 'traveler'
                     check (organizer_role in ('traveler','guide','coach','driver','organizer')),
  address          text not null default '',
  city             text not null default '',
  country          text not null default '',
  lat              double precision,
  lng              double precision,
  min_participants int not null default 2,
  max_participants int not null default 20,
  event_date       date,
  event_time       text,
  min_deadline     date,
  whatsapp_link    text,
  telegram_link    text,
  contact_info     text not null default '',
  phone            text,
  tags             text[] default '{}',
  expires_at       timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- Card Images
-- ============================================================
create table if not exists public.card_images (
  id        uuid default uuid_generate_v4() primary key,
  card_id   uuid references public.travel_cards(id) on delete cascade not null,
  url       text not null,
  position  int not null default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- Participants
-- ============================================================
create table if not exists public.participants (
  id         uuid default uuid_generate_v4() primary key,
  card_id    uuid references public.travel_cards(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  joined_at  timestamptz default now(),
  unique(card_id, user_id)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.travel_cards  enable row level security;
alter table public.card_images   enable row level security;
alter table public.participants  enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "profiles_select"       on public.profiles;
drop policy if exists "profiles_insert"       on public.profiles;
drop policy if exists "profiles_update"       on public.profiles;
drop policy if exists "cards_select"          on public.travel_cards;
drop policy if exists "cards_insert"          on public.travel_cards;
drop policy if exists "cards_update"          on public.travel_cards;
drop policy if exists "cards_delete"          on public.travel_cards;
drop policy if exists "images_select"         on public.card_images;
drop policy if exists "images_insert"         on public.card_images;
drop policy if exists "images_delete"         on public.card_images;
drop policy if exists "participants_select"   on public.participants;
drop policy if exists "participants_insert"   on public.participants;
drop policy if exists "participants_delete"   on public.participants;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Travel cards
create policy "cards_select" on public.travel_cards for select using (true);
create policy "cards_insert" on public.travel_cards for insert with check (auth.uid() = user_id);
create policy "cards_update" on public.travel_cards for update using (auth.uid() = user_id);
create policy "cards_delete" on public.travel_cards for delete using (auth.uid() = user_id);

-- Card images
create policy "images_select" on public.card_images for select using (true);
create policy "images_insert" on public.card_images for insert with check (
  auth.uid() = (select user_id from public.travel_cards where id = card_id)
);
create policy "images_delete" on public.card_images for delete using (
  auth.uid() = (select user_id from public.travel_cards where id = card_id)
);

-- Participants
create policy "participants_select" on public.participants for select using (true);
create policy "participants_insert" on public.participants for insert with check (auth.uid() = user_id);
create policy "participants_delete" on public.participants for delete using (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set full_name  = excluded.full_name,
        phone      = excluded.phone,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Storage bucket for card images
-- ============================================================
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict do nothing;

drop policy if exists "card_images_public_read"  on storage.objects;
drop policy if exists "card_images_auth_upload"  on storage.objects;
drop policy if exists "card_images_owner_delete" on storage.objects;

create policy "card_images_public_read" on storage.objects
  for select using (bucket_id = 'card-images');

create policy "card_images_auth_upload" on storage.objects
  for insert with check (bucket_id = 'card-images' and auth.role() = 'authenticated');

create policy "card_images_owner_delete" on storage.objects
  for delete using (bucket_id = 'card-images' and auth.uid()::text = (storage.foldername(name))[1]);
