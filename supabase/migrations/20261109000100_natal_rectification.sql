create table if not exists public.natal_rectifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  birth_date date not null,
  birth_city text not null check (char_length(trim(birth_city)) between 1 and 120),
  birth_country text not null check (char_length(trim(birth_country)) between 1 and 120),
  birth_latitude double precision not null
    check (birth_latitude between -90 and 90),
  birth_longitude double precision not null
    check (birth_longitude between -180 and 180),
  birth_timezone text not null
    check (char_length(trim(birth_timezone)) between 1 and 100),
  interval_start_date date not null,
  interval_start_time time without time zone not null,
  interval_end_date date not null,
  interval_end_time time without time zone not null,
  candidate_step_minutes integer not null default 5
    check (candidate_step_minutes between 1 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (interval_start_date + interval_start_time)
    <= (interval_end_date + interval_end_time)
  ),
  check (
    birth_date between interval_start_date and interval_end_date
  )
);

create index if not exists natal_rectifications_user_updated_idx
  on public.natal_rectifications (user_id, updated_at desc);

create table if not exists public.rectification_events (
  id uuid primary key default gen_random_uuid(),
  rectification_id uuid not null
    references public.natal_rectifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (
    category in (
      'marriage',
      'separation',
      'child_birth',
      'move',
      'emigration',
      'career_change',
      'promotion',
      'business',
      'personal_crisis',
      'family_death',
      'accident',
      'surgery',
      'other'
    )
  ),
  date_start date not null,
  date_end date not null,
  date_precision text not null check (
    date_precision in ('exact', 'approximate', 'month', 'year', 'interval')
  ),
  event_timezone text
    check (event_timezone is null or char_length(trim(event_timezone)) between 1 and 100),
  description text
    check (description is null or char_length(description) <= 2000),
  relevance smallint not null default 3 check (relevance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (date_end >= date_start),
  check (
    (date_precision = 'exact' and date_start = date_end)
    or date_precision <> 'exact'
  ),
  unique (id, rectification_id, user_id)
);

create index if not exists rectification_events_case_date_idx
  on public.rectification_events (rectification_id, date_start, date_end);

create table if not exists public.natal_rectification_runs (
  id uuid primary key default gen_random_uuid(),
  rectification_id uuid not null
    references public.natal_rectifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  methodology_version text not null
    check (char_length(trim(methodology_version)) between 1 and 40),
  status text not null check (
    status in ('insufficient_evidence', 'ambiguous', 'relative_ranking')
  ),
  candidate_count integer not null check (candidate_count between 1 and 300),
  event_count integer not null check (event_count between 1 and 50),
  score_gap double precision
    check (score_gap is null or score_gap between 0 and 1),
  input_snapshot jsonb not null
    check (jsonb_typeof(input_snapshot) = 'object'),
  results jsonb not null
    check (jsonb_typeof(results) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists natal_rectification_runs_case_created_idx
  on public.natal_rectification_runs (rectification_id, created_at desc);

create or replace function public.enforce_rectification_event_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  existing_count bigint;
begin
  perform 1
  from public.natal_rectifications
  where id = new.rectification_id
    and user_id = new.user_id
  for update;

  if not found then
    return new;
  end if;

  select count(*)
  into existing_count
  from public.rectification_events e
  where e.rectification_id = new.rectification_id
    and (tg_op = 'INSERT' or e.id <> new.id);

  if existing_count >= 50 then
    raise exception using
      errcode = '23514',
      message = 'A rectification may contain at most 50 events.';
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_rectification_event_limit()
  from public, anon, authenticated;

drop trigger if exists rectification_events_limit
  on public.rectification_events;
create trigger rectification_events_limit
  before insert or update of rectification_id, user_id
  on public.rectification_events
  for each row execute function public.enforce_rectification_event_limit();

create table if not exists public.rectification_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  rectification_id uuid not null,
  event_id uuid,
  entity_type text not null check (entity_type in ('rectification', 'event', 'run')),
  operation text not null check (operation in ('insert', 'update', 'delete')),
  created_at timestamptz not null default now()
);

create index if not exists rectification_audit_user_created_idx
  on public.rectification_audit (user_id, created_at desc);

alter table public.natal_rectifications enable row level security;
alter table public.rectification_events enable row level security;
alter table public.natal_rectification_runs enable row level security;
alter table public.rectification_audit enable row level security;

drop policy if exists "Users manage their own rectifications"
  on public.natal_rectifications;
create policy "Users manage their own rectifications"
  on public.natal_rectifications for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage events in their own rectifications"
  on public.rectification_events;
create policy "Users manage events in their own rectifications"
  on public.rectification_events for all to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.natal_rectifications r
      where r.id = rectification_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.natal_rectifications r
      where r.id = rectification_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users view runs in their own rectifications"
  on public.natal_rectification_runs;
create policy "Users view runs in their own rectifications"
  on public.natal_rectification_runs for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.natal_rectifications r
      where r.id = rectification_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users create runs in their own rectifications"
  on public.natal_rectification_runs;
create policy "Users create runs in their own rectifications"
  on public.natal_rectification_runs for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.natal_rectifications r
      where r.id = rectification_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete runs in their own rectifications"
  on public.natal_rectification_runs;
create policy "Users delete runs in their own rectifications"
  on public.natal_rectification_runs for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.natal_rectifications r
      where r.id = rectification_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users view their own rectification audit"
  on public.rectification_audit;
create policy "Users view their own rectification audit"
  on public.rectification_audit for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.natal_rectifications from public, anon, authenticated;
grant select, insert, update, delete on public.natal_rectifications to authenticated;
revoke all on public.rectification_events from public, anon, authenticated;
grant select, insert, update, delete on public.rectification_events to authenticated;
revoke all on public.natal_rectification_runs from public, anon, authenticated;
grant select, insert, delete on public.natal_rectification_runs to authenticated;
revoke all on public.rectification_audit from public, anon, authenticated;
grant select on public.rectification_audit to authenticated;

create or replace function public.audit_rectification_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_user_id uuid;
  target_rectification_id uuid;
  target_event_id uuid;
begin
  if tg_op = 'DELETE' then
    target_user_id := old.user_id;
    if tg_table_name = 'rectification_events' then
      target_rectification_id := old.rectification_id;
      target_event_id := old.id;
    elsif tg_table_name = 'natal_rectification_runs' then
      target_rectification_id := old.rectification_id;
    else
      target_rectification_id := old.id;
    end if;
  else
    target_user_id := new.user_id;
    if tg_table_name = 'rectification_events' then
      target_rectification_id := new.rectification_id;
      target_event_id := new.id;
    elsif tg_table_name = 'natal_rectification_runs' then
      target_rectification_id := new.rectification_id;
    else
      target_rectification_id := new.id;
    end if;
  end if;

  insert into public.rectification_audit (
    user_id,
    rectification_id,
    event_id,
    entity_type,
    operation
  )
  values (
    target_user_id,
    target_rectification_id,
    target_event_id,
    case
      when tg_table_name = 'rectification_events' then 'event'
      when tg_table_name = 'natal_rectification_runs' then 'run'
      else 'rectification'
    end,
    lower(tg_op)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke all on function public.audit_rectification_change() from public, anon, authenticated;

drop trigger if exists natal_rectifications_audit
  on public.natal_rectifications;
create trigger natal_rectifications_audit
  after insert or update or delete on public.natal_rectifications
  for each row execute function public.audit_rectification_change();

drop trigger if exists rectification_events_audit
  on public.rectification_events;
create trigger rectification_events_audit
  after insert or update or delete on public.rectification_events
  for each row execute function public.audit_rectification_change();

drop trigger if exists natal_rectification_runs_audit
  on public.natal_rectification_runs;
create trigger natal_rectification_runs_audit
  after insert or delete on public.natal_rectification_runs
  for each row execute function public.audit_rectification_change();
