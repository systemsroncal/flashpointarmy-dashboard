-- Community module directory: users with role `member` only (excludes local_leader, admin, super_admin).

create or replace view public.dashboard_community_members as
select du.*
from public.dashboard_users du
where exists (
  select 1
  from public.user_roles ur
  inner join public.roles r on r.id = ur.role_id
  where ur.user_id = du.id
    and r.name = 'member'
)
and not exists (
  select 1
  from public.user_roles ur
  inner join public.roles r on r.id = ur.role_id
  where ur.user_id = du.id
    and r.name in ('local_leader', 'admin', 'super_admin')
);

comment on view public.dashboard_community_members is
  'Users with the member role who are not leaders or admins (Community members list).';

grant select on public.dashboard_community_members to authenticated, service_role;
