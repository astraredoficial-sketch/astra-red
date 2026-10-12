alter table public.chat_messages
  add column if not exists read_at timestamptz;

create index if not exists chat_messages_unread_recipient_idx
  on public.chat_messages (recipient_id, created_at)
  where read_at is null;

drop policy if exists "Recipients can mark messages as read"
  on public.chat_messages;
create policy "Recipients can mark messages as read"
  on public.chat_messages for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id and read_at is not null);

grant update (read_at) on public.chat_messages to authenticated;

create table if not exists public.chat_message_email_notifications (
  message_id uuid primary key
    references public.chat_messages (id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.chat_message_email_notifications enable row level security;
revoke all on public.chat_message_email_notifications
  from public, anon, authenticated;
grant insert, delete on public.chat_message_email_notifications to service_role;
