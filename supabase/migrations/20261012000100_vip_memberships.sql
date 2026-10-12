create table if not exists public.vip_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.vip_memberships enable row level security;

revoke all on public.vip_memberships from public, anon, authenticated;
grant select, insert, update, delete on public.vip_memberships to service_role;

create or replace function public.are_both_users_vip(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and target_user_id is not null
    and target_user_id <> auth.uid()
    and exists (
      select 1
      from public.vip_memberships current_membership
      where current_membership.user_id = auth.uid()
        and current_membership.expires_at > now()
    )
    and exists (
      select 1
      from public.vip_memberships target_membership
      where target_membership.user_id = target_user_id
        and target_membership.expires_at > now()
    );
$function$;

revoke all on function public.are_both_users_vip(uuid) from public, anon;
grant execute on function public.are_both_users_vip(uuid) to authenticated;
