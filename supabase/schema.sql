-- GoTogether Database Schema v2
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Card types enum
create type card_type as enum ('trip', 'attraction', 'workshop', 'sport', 'food', 'other');
create type organizer_role as enum ('traveler', 'guide', 'coach', 'driver', 'organizer');

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Travel cards
create table if not exists travel_cards (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  description       text not null,
  type              card_type not null default 'trip',
  organizer_role    organizer_role not null default 'traveler',
  address           text not null,
  city              text not null,
  country           text not null,
  lat               double precision,
  lng               double precision,
  min_participants  int not null default 2,
  max_participants  int not null default 20,
  event_date        date,
  event_time        time,
  min_deadline      date,
  contact_info      text not null,
  phone             text,
  whatsapp_link     text,
  telegram_link     text,
  created_at        timestamptz not null default now(),
  expires_at        timestamptz,
  tags              text[] default '{}'
);

-- Card images
create table if not exists card_images (
  id       uuid primary key default uuid_generate_v4(),
  card_id  uuid references travel_cards(id) on delete cascade,
  url      text not null,
  position int not null default 0
);

-- Participants
create table if not exists participants (
  id        uuid primary key default uuid_generate_v4(),
  card_id   uuid references travel_cards(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(card_id, user_id)
);

-- Indexes
create index if not exists idx_travel_cards_user_id on travel_cards(user_id);
create index if not exists idx_travel_cards_city on travel_cards(city);
create index if not exists idx_travel_cards_type on travel_cards(type);
create index if not exists idx_travel_cards_created_at on travel_cards(created_at desc);
create index if not exists idx_participants_card_id on participants(card_id);
create index if not exists idx_participants_user_id on participants(user_id);

-- RLS
alter table profiles enable row level security;
alter table travel_cards enable row level security;
alter table card_images enable row level security;
alter table participants enable row level security;

-- Profiles policies
create policy "Users can read all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Cards policies
create policy "Anyone can read cards" on travel_cards for select using (true);
create policy "Auth users can create cards" on travel_cards for insert with check (auth.uid() = user_id);
create policy "Owner can update card" on travel_cards for update using (auth.uid() = user_id);
create policy "Owner can delete card" on travel_cards for delete using (auth.uid() = user_id);

-- Images policies
create policy "Anyone can read images" on card_images for select using (true);
create policy "Card owner can add images" on card_images for insert with check (
  exists (select 1 from travel_cards where id = card_id and user_id = auth.uid())
);

-- Participants policies
create policy "Anyone can read participants" on participants for select using (true);
create policy "Auth users can join" on participants for insert with check (auth.uid() = user_id);
create policy "Users can leave" on participants for delete using (auth.uid() = user_id);

-- View: cards with full details
create or replace view cards_full as
  select
    c.*,
    p.full_name as creator_name,
    p.phone as creator_phone,
    count(part.id)::int as current_participants
  from travel_cards c
  join profiles p on p.id = c.user_id
  left join participants part on part.card_id = c.id
  group by c.id, p.full_name, p.phone;
