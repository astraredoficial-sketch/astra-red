update public.app_feature_flags
set enabled = false,
    updated_at = now()
where flag = 'beta_vip_access';

create or replace function public.are_both_users_vip(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select false;
$function$;

comment on function public.are_both_users_vip(uuid) is
  'Retired compatibility RPC. AstraRed features are free and no VIP access check is performed.';
