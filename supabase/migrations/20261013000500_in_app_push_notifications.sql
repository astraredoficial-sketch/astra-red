create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_key text not null unique,
  event_type text not null check (
    event_type in ('message', 'match', 'astral', 'compatibility')
  ),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists app_notifications_unread_recipient_idx
  on public.app_notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.app_notifications enable row level security;
revoke all on public.app_notifications from public, anon;
grant select on public.app_notifications to authenticated;
grant update (read_at) on public.app_notifications to authenticated;
grant select, insert, update, delete on public.app_notifications to service_role;

drop policy if exists "Users can view their own app notifications"
  on public.app_notifications;
create policy "Users can view their own app notifications"
  on public.app_notifications for select to authenticated
  using (auth.uid() = recipient_id);

drop policy if exists "Users can mark their own app notifications as read"
  on public.app_notifications;
create policy "Users can mark their own app notifications as read"
  on public.app_notifications for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id and read_at is not null);

create table if not exists public.push_devices (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android')),
  updated_at timestamptz not null default now()
);

create index if not exists push_devices_user_id_idx
  on public.push_devices (user_id);

alter table public.push_devices enable row level security;
revoke all on public.push_devices from public, anon;
grant select, insert, update, delete on public.push_devices to authenticated;
grant select, insert, update, delete on public.push_devices to service_role;

drop policy if exists "Users can manage their own push devices"
  on public.push_devices;
create policy "Users can manage their own push devices"
  on public.push_devices for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do language plpgsql $publication$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_notifications'
  ) then
    alter publication supabase_realtime add table public.app_notifications;
  end if;
end;
$publication$;
