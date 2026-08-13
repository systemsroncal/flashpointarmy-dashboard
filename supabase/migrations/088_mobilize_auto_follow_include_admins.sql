-- Expand auto-follow eligibility to admins (admin, sub_admin, super_admin)
-- in addition to member and local_leader.

create or replace function public.apply_mobilize_auto_follow_for_user(p_follower_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if p_follower_id is null then
    return 0;
  end if;

  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_follower_id
      and r.name in ('member', 'local_leader', 'admin', 'sub_admin', 'super_admin')
  ) then
    return 0;
  end if;

  insert into public.mobilize_user_follows (follower_id, following_id)
  select p_follower_id, t.user_id
  from public.mobilize_auto_follow_targets t
  where t.user_id <> p_follower_id
    and exists (select 1 from public.dashboard_users d where d.id = t.user_id)
  on conflict (follower_id, following_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on function public.apply_mobilize_auto_follow_for_user(uuid) is
  'Make a member/local_leader/admin follow every mobilize_auto_follow_targets user. Idempotent.';
