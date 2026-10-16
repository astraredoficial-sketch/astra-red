create or replace function public.can_view_profile_for_discovery(
  target_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $function$
  select case
    when auth.uid() is null then false
    when target_profile_id = auth.uid() then true
    else exists (
      select 1
      from public.profiles viewer
      join public.profiles candidate
        on candidate.id = target_profile_id
      where viewer.id = auth.uid()
        and (
          (
            (viewer.target_gender = 'ambos'
              or candidate.gender = viewer.target_gender)
            and (candidate.target_gender = 'ambos'
              or viewer.gender = candidate.target_gender)
            and (viewer.looking_for = 'ambos'
              or candidate.looking_for = 'ambos'
              or viewer.looking_for = candidate.looking_for)
          )
          or exists (
            select 1
            from public.matches m
            where (m.user_a = auth.uid()
                and m.user_b = target_profile_id)
               or (m.user_b = auth.uid()
                and m.user_a = target_profile_id)
          )
        )
        and not exists (
          select 1
          from public.chat_user_blocks b
          where (b.blocker_id = auth.uid()
              and b.blocked_user_id = target_profile_id)
             or (b.blocker_id = target_profile_id
              and b.blocked_user_id = auth.uid())
        )
    )
  end;
$function$;

revoke all on function public.can_view_profile_for_discovery(uuid)
  from public, anon;
grant execute on function public.can_view_profile_for_discovery(uuid)
  to authenticated;

drop policy if exists "Authenticated users can view profiles"
  on public.profiles;
drop policy if exists "Eligible users can view discoverable profiles"
  on public.profiles;
create policy "Eligible users can view discoverable profiles"
  on public.profiles for select to authenticated
  using (public.can_view_profile_for_discovery(id));
