create table if not exists public.chat_user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

alter table public.chat_user_blocks enable row level security;
revoke all on public.chat_user_blocks from public, anon, authenticated;
grant select on public.chat_user_blocks to authenticated;
grant all on public.chat_user_blocks to service_role;

drop policy if exists "Users can view blocks involving themselves"
  on public.chat_user_blocks;
create policy "Users can view blocks involving themselves"
  on public.chat_user_blocks for select to authenticated
  using (auth.uid() = blocker_id or auth.uid() = blocked_user_id);

create table if not exists public.chat_user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (
    reason in (
      'obscene',
      'harassment',
      'spam',
      'other'
    )
  ),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

create index if not exists chat_user_reports_reported_created_idx
  on public.chat_user_reports (reported_user_id, created_at desc);

alter table public.chat_user_reports enable row level security;
revoke all on public.chat_user_reports from public, anon, authenticated;
grant all on public.chat_user_reports to service_role;

drop policy if exists "Matched users can view matches"
  on public.matches;
create policy "Matched users can view matches"
  on public.matches for select to authenticated
  using (
    (auth.uid() = user_a or auth.uid() = user_b)
    and not exists (
      select 1
      from public.chat_user_blocks b
      where (b.blocker_id = matches.user_a and b.blocked_user_id = matches.user_b)
         or (b.blocker_id = matches.user_b and b.blocked_user_id = matches.user_a)
    )
  );

drop policy if exists "Matched users can view messages"
  on public.chat_messages;
create policy "Matched users can view messages"
  on public.chat_messages for select to authenticated
  using (
    auth.uid() in (chat_messages.sender_id, chat_messages.recipient_id)
    and exists (
      select 1
      from public.matches m
      where (
        (m.user_a = chat_messages.sender_id
          and m.user_b = chat_messages.recipient_id)
        or (m.user_b = chat_messages.sender_id
          and m.user_a = chat_messages.recipient_id)
      )
    )
    and not exists (
      select 1
      from public.chat_user_blocks b
      where (b.blocker_id = chat_messages.sender_id
          and b.blocked_user_id = chat_messages.recipient_id)
         or (b.blocker_id = chat_messages.recipient_id
          and b.blocked_user_id = chat_messages.sender_id)
    )
  );
