create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Usuario',
  gender text not null default 'otro'
    check (gender in ('hombre', 'mujer', 'otro')),
  target_gender text not null default 'ambos'
    check (target_gender in ('hombre', 'mujer', 'ambos')),
  looking_for text not null default 'ambos',
  location_country text not null default '',
  location_city text not null default '',
  city_id text not null default '',
  chart jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists name text not null default 'Usuario',
  add column if not exists gender text not null default 'otro',
  add column if not exists target_gender text not null default 'ambos',
  add column if not exists looking_for text not null default 'ambos',
  add column if not exists location_country text not null default '',
  add column if not exists location_city text not null default '',
  add column if not exists city_id text not null default '',
  add column if not exists chart jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists birth_date date,
  add column if not exists birth_time time,
  add column if not exists birth_time_unknown boolean,
  add column if not exists birth_latitude double precision,
  add column if not exists birth_longitude double precision,
  add column if not exists birth_timezone text;

alter table public.profiles
  alter column birth_date drop not null,
  alter column birth_time drop not null,
  alter column birth_time_unknown drop not null,
  alter column birth_latitude drop not null,
  alter column birth_longitude drop not null,
  alter column birth_timezone drop not null;

update public.profiles
set name = coalesce(nullif(trim(name), ''), 'Usuario'),
    gender = coalesce(gender, 'otro'),
    target_gender = coalesce(target_gender, 'ambos'),
    looking_for = coalesce(looking_for, 'ambos'),
    location_country = coalesce(location_country, ''),
    location_city = coalesce(location_city, ''),
    city_id = coalesce(city_id, ''),
    chart = coalesce(chart, '{}'::jsonb),
    updated_at = coalesce(updated_at, now());

update public.profiles
set target_gender = case lower(target_gender)
  when 'hombres' then 'hombre'
  when 'men' then 'hombre'
  when 'mujeres' then 'mujer'
  when 'women' then 'mujer'
  when 'todos' then 'ambos'
  when 'both' then 'ambos'
  when 'otro' then 'ambos'
  else 'ambos'
end
where lower(target_gender) not in ('hombre', 'mujer', 'ambos');

update public.profiles
set gender = case lower(gender)
  when 'hombre' then 'hombre'
  when 'masculino' then 'hombre'
  when 'male' then 'hombre'
  when 'mujer' then 'mujer'
  when 'femenino' then 'mujer'
  when 'female' then 'mujer'
  else 'otro'
end
where gender is null or lower(gender) not in ('hombre', 'mujer', 'otro');

update public.profiles
set looking_for = case lower(looking_for)
  when 'relación' then 'pareja'
  when 'relacion' then 'pareja'
  when 'amistad' then 'amistad'
  when 'pareja' then 'pareja'
  else 'ambos'
end
where looking_for is null
   or lower(looking_for) not in ('amistad', 'pareja', 'ambos');

create table if not exists public.birth_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  birth_time time,
  birth_time_unknown boolean not null default false,
  city_id text not null,
  location_country text not null,
  location_city text not null,
  birth_latitude double precision not null,
  birth_longitude double precision not null,
  birth_timezone text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_likes (
  liker_id uuid not null references auth.users (id) on delete cascade,
  liked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id),
  check (liker_id <> liked_id)
);

create table if not exists public.matches (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (sender_id, recipient_id, created_at);

alter table public.profiles
  alter column name set default 'Usuario',
  alter column name set not null,
  alter column gender set default 'otro',
  alter column gender set not null,
  alter column target_gender set default 'ambos',
  alter column target_gender set not null,
  alter column looking_for set default 'ambos',
  alter column looking_for set not null,
  alter column location_country set default '',
  alter column location_country set not null,
  alter column location_city set default '',
  alter column location_city set not null,
  alter column city_id set default '',
  alter column city_id set not null,
  alter column chart set default '{}'::jsonb,
  alter column chart set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.profiles enable row level security;
alter table public.birth_details enable row level security;
alter table public.profile_likes enable row level security;
alter table public.matches enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Authenticated users can view profiles"
  on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "Users can create their own profile"
  on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile"
  on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view their own birth details"
  on public.birth_details;
create policy "Users can view their own birth details"
  on public.birth_details for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own birth details"
  on public.birth_details;
create policy "Users can create their own birth details"
  on public.birth_details for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own birth details"
  on public.birth_details;
create policy "Users can update their own birth details"
  on public.birth_details for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own likes"
  on public.profile_likes;
create policy "Users can view their own likes"
  on public.profile_likes for select to authenticated
  using (auth.uid() = liker_id);

drop policy if exists "Users can create their own likes"
  on public.profile_likes;
create policy "Users can create their own likes"
  on public.profile_likes for insert to authenticated
  with check (auth.uid() = liker_id);

drop policy if exists "Matched users can view their matches"
  on public.matches;
create policy "Matched users can view their matches"
  on public.matches for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Matched users can view messages"
  on public.chat_messages;
create policy "Matched users can view messages"
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where (
        (m.user_a = chat_messages.sender_id
          and m.user_b = chat_messages.recipient_id)
        or (m.user_b = chat_messages.sender_id
          and m.user_a = chat_messages.recipient_id)
      )
        and auth.uid() in (chat_messages.sender_id, chat_messages.recipient_id)
    )
  );

drop policy if exists "Matched users can send messages"
  on public.chat_messages;
create policy "Matched users can send messages"
  on public.chat_messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.matches m
      where (m.user_a = auth.uid() and m.user_b = recipient_id)
         or (m.user_b = auth.uid() and m.user_a = recipient_id)
    )
  );

create or replace function public.like_profile(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := auth.uid();
  matched boolean := false;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para dar me gusta.';
  end if;
  if current_user_id = target_user_id then
    raise exception 'No puedes dar me gusta a tu propio perfil.';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = target_user_id
  ) then
    raise exception 'El perfil ya no está disponible.';
  end if;

  insert into public.profile_likes (liker_id, liked_id)
  values (current_user_id, target_user_id)
  on conflict do nothing;

  if exists (
    select 1
    from public.profile_likes l
    where l.liker_id = target_user_id
      and l.liked_id = current_user_id
  ) then
    insert into public.matches (user_a, user_b)
    values (
      least(current_user_id, target_user_id),
      greatest(current_user_id, target_user_id)
    )
    on conflict do nothing;
    matched := true;
  end if;

  return matched;
end;
$function$;

revoke all on function public.like_profile(uuid) from public;
grant execute on function public.like_profile(uuid) to authenticated;
revoke all on public.profiles from public, anon, authenticated;
grant select (
  id, name, gender, target_gender, looking_for, location_country,
  location_city, city_id, chart, updated_at
) on public.profiles to authenticated;
grant insert (
  id, name, gender, target_gender, looking_for, location_country,
  location_city, city_id, chart, updated_at
) on public.profiles to authenticated;

revoke all on public.birth_details from public, anon, authenticated;
grant select, insert, update on public.birth_details to authenticated;
revoke all on public.profile_likes from public, anon, authenticated;
grant select, insert on public.profile_likes to authenticated;
revoke all on public.matches from public, anon, authenticated;
grant select on public.matches to authenticated;
revoke all on public.chat_messages from public, anon, authenticated;
grant select, insert on public.chat_messages to authenticated;
grant update (
  id, name, gender, target_gender, looking_for, location_country,
  location_city, city_id, chart, updated_at
) on public.profiles to authenticated;

do $publication$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$publication$;
