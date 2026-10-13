create table if not exists public.app_email_notifications (
  notification_key text primary key,
  event_type text not null check (event_type in ('message', 'match', 'astral')),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.app_email_notifications enable row level security;
revoke all on public.app_email_notifications from public, anon, authenticated;
grant select, insert, delete on public.app_email_notifications to service_role;
