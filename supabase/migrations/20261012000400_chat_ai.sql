revoke insert on public.chat_messages from authenticated;
drop policy if exists "Matched users can send messages"
  on public.chat_messages;
grant select, insert on public.chat_messages to service_role;

create table if not exists public.chat_ai_requests (
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now()
);

create index if not exists chat_ai_requests_user_time_idx
  on public.chat_ai_requests (user_id, requested_at);

alter table public.chat_ai_requests enable row level security;
revoke all on public.chat_ai_requests from public, anon, authenticated;
grant all on public.chat_ai_requests to service_role;

create or replace function public.consume_chat_ai_request()
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  actor uuid := auth.uid();
  recent_requests integer;
begin
  if actor is null then
    raise exception 'Debes iniciar sesión para usar el asistente.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor::text, 0)
  );

  delete from public.chat_ai_requests
  where requested_at < pg_catalog.now() - interval '1 hour';

  select pg_catalog.count(*)::integer
    into recent_requests
    from public.chat_ai_requests
    where user_id = actor
      and requested_at >= pg_catalog.now() - interval '1 hour';

  if recent_requests >= 30 then
    return false;
  end if;

  insert into public.chat_ai_requests (user_id) values (actor);
  return true;
end;
$function$;

revoke all on function public.consume_chat_ai_request()
  from public, anon, authenticated;
grant execute on function public.consume_chat_ai_request()
  to authenticated;
