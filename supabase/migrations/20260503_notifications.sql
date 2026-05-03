-- Notifications: in-app messages to users about events on their cards
create table if not exists public.notifications (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null check (type in ('participant_joined', 'min_reached', 'deadline_soon')),
  card_id       uuid references public.travel_cards(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  read          boolean not null default false,
  created_at    timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;

-- Users can only see their own notifications
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
-- Users can mark their own notifications as read
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);
-- Users can delete their own notifications
create policy "notifications_delete" on public.notifications for delete using (auth.uid() = user_id);

-- DB trigger: when someone joins a card, notify the card owner (unless self-join)
create or replace function public.notify_card_owner_on_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  card_min int;
  current_count int;
begin
  select user_id, min_participants into owner_id, card_min
  from public.travel_cards where id = new.card_id;

  -- Skip self-join
  if owner_id = new.user_id then
    return new;
  end if;

  -- Always notify on join
  insert into public.notifications (user_id, type, card_id, actor_id)
  values (owner_id, 'participant_joined', new.card_id, new.user_id);

  -- If this join brings the card to its minimum, send a separate notification
  select count(*) into current_count from public.participants where card_id = new.card_id;
  if current_count = card_min then
    insert into public.notifications (user_id, type, card_id, actor_id)
    values (owner_id, 'min_reached', new.card_id, new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_card_owner_on_join on public.participants;
create trigger trg_notify_card_owner_on_join
  after insert on public.participants
  for each row execute procedure public.notify_card_owner_on_join();
