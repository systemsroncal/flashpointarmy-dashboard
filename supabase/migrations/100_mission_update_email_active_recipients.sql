-- Mission Update emails: recipients active within a rolling window (presence + last sign-in).

alter table public.dashboard_announcement_email_jobs
  add column if not exists excluded_inactive_count int not null default 0;

create or replace function public.mission_update_email_active_user_ids(p_active_since timestamptz)
returns table(user_id uuid)
language sql
stable
security definer
set search_path = public, auth
as $$
  select distinct x.user_id
  from (
    select dp.user_id
    from public.dashboard_presence_daily dp
    where dp.last_seen_at >= p_active_since
    union
    select du.id as user_id
    from public.dashboard_users du
    inner join auth.users au on au.id = du.id
    where au.last_sign_in_at is not null
      and au.last_sign_in_at >= p_active_since
  ) x;
$$;

revoke all on function public.mission_update_email_active_user_ids(timestamptz) from public;
grant execute on function public.mission_update_email_active_user_ids(timestamptz) to service_role;