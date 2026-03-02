-- GoTogether Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Card types enum
create type card_type as enum ('trip', 'attraction', 'workshop', 'sport', 'food', 'other');

-- Travel cards table
create table if not exists travel_cards (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text not null,
  type          card_type not null default 'trip',
  address       text not null,
  city          text not null,
  country       text not null,
  lat           double precision,
  lng           double precision,
  min_participants int not null default 2,
  max_participants int not null default 20,
  contact_info  text not null,
  whatsapp_link text,
  telegram_link text,
  created_by    text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  tags          text[] default '{}'
);

-- Card images table
create table if not exists card_images (
  id       uuid primary key default uuid_generate_v4(),
  card_id  uuid references travel_cards(id) on delete cascade,
  url      text not null,
  position int not null default 0
);

-- Participants table
create table if not exists participants (
  id        uuid primary key default uuid_generate_v4(),
  card_id   uuid references travel_cards(id) on delete cascade,
  name      text not null,
  avatar    text,
  joined_at timestamptz not null default now(),
  unique(card_id, name)
);

-- Indexes
create index if not exists idx_travel_cards_city on travel_cards(city);
create index if not exists idx_travel_cards_type on travel_cards(type);
create index if not exists idx_travel_cards_created_at on travel_cards(created_at desc);
create index if not exists idx_participants_card_id on participants(card_id);
create index if not exists idx_card_images_card_id on card_images(card_id);

-- RLS (Row Level Security)
alter table travel_cards enable row level security;
alter table card_images enable row level security;
alter table participants enable row level security;

-- Policies: public read
create policy "Public can read cards" on travel_cards for select using (true);
create policy "Public can read images" on card_images for select using (true);
create policy "Public can read participants" on participants for select using (true);

-- Policies: anyone can insert (no auth yet — add user_id later)
create policy "Anyone can create cards" on travel_cards for insert with check (true);
create policy "Anyone can add images" on card_images for insert with check (true);
create policy "Anyone can join" on participants for insert with check (true);

-- View: cards with participant count
create or replace view cards_with_count as
  select
    c.*,
    count(p.id)::int as current_participants
  from travel_cards c
  left join participants p on p.card_id = c.id
  group by c.id;
