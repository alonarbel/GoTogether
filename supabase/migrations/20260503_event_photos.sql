-- Photos uploaded by participants after an event has happened
create table if not exists public.event_photos (
  id          uuid default uuid_generate_v4() primary key,
  card_id     uuid references public.travel_cards(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  url         text not null,
  caption     text,
  created_at  timestamptz default now()
);

create index if not exists event_photos_card_id_idx on public.event_photos(card_id);

alter table public.event_photos enable row level security;

drop policy if exists "event_photos_select" on public.event_photos;
drop policy if exists "event_photos_insert" on public.event_photos;
drop policy if exists "event_photos_delete" on public.event_photos;

-- Anyone can view event photos
create policy "event_photos_select" on public.event_photos for select using (true);

-- Only participants of the card can upload
create policy "event_photos_insert" on public.event_photos for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.participants
    where card_id = event_photos.card_id and user_id = auth.uid()
  )
);

-- Uploader can delete their own photos
create policy "event_photos_delete" on public.event_photos for delete using (auth.uid() = user_id);
