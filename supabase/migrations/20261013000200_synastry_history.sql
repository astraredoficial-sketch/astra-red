create table if not exists public.synastry_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  other_name text not null check (char_length(trim(other_name)) between 1 and 80),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists synastry_history_user_created_idx
  on public.synastry_history (user_id, created_at desc);

alter table public.synastry_history enable row level security;
revoke all on public.synastry_history from public, anon, authenticated;
grant select, insert, delete on public.synastry_history to authenticated;

drop policy if exists "Users can view their own synastry history"
  on public.synastry_history;
create policy "Users can view their own synastry history"
  on public.synastry_history for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own synastry history"
  on public.synastry_history;
create policy "Users can create their own synastry history"
  on public.synastry_history for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own synastry history"
  on public.synastry_history;
create policy "Users can delete their own synastry history"
  on public.synastry_history for delete to authenticated
  using (auth.uid() = user_id);
