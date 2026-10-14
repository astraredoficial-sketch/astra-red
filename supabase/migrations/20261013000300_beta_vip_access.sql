create table if not exists public.app_feature_flags (
  flag text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.app_feature_flags enable row level security;
revoke all on public.app_feature_flags from public, anon, authenticated;
grant select, insert, update, delete on public.app_feature_flags to service_role;

insert into public.app_feature_flags (flag, enabled)
values ('beta_vip_access', true)
on conflict (flag) do update
  set enabled = excluded.enabled,
      updated_at = now();

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
    and (
      exists (
        select 1
        from public.app_feature_flags beta_access
        where beta_access.flag = 'beta_vip_access'
          and beta_access.enabled
      )
      or (
        exists (
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
        )
      )
    );
$function$;

revoke all on function public.are_both_users_vip(uuid) from public, anon;
grant execute on function public.are_both_users_vip(uuid) to authenticated;
