create table if not exists public.astral_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  activity text not null check (
    activity in (
      'hair-growth',
      'hair-maintenance',
      'planting',
      'pruning-harvest',
      'moon-observation'
    )
  ),
  event_date date not null,
  lunar_phase text not null,
  illumination smallint not null check (illumination between 0 and 100),
  recommendation text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_date, activity)
);

create index if not exists astral_events_user_date_idx
  on public.astral_events (user_id, event_date);

alter table public.astral_events enable row level security;

drop policy if exists "Users can view their own astral events"
  on public.astral_events;
create policy "Users can view their own astral events"
  on public.astral_events for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own astral events"
  on public.astral_events;
create policy "Users can create their own astral events"
  on public.astral_events for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own astral events"
  on public.astral_events;
create policy "Users can delete their own astral events"
  on public.astral_events for delete to authenticated
  using (auth.uid() = user_id);

revoke all on public.astral_events from public, anon, authenticated;
grant select, insert, delete on public.astral_events to authenticated;
