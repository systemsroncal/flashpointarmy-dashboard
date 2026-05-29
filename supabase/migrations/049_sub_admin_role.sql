-- Sub Admin: chapter + user operations like admin, without Mobilize or Settings modules.

insert into public.roles (name, description)
values (
  'sub_admin',
  'Manages chapters and users; no Mobilize or Settings access'
)
on conflict (name) do update set
  description = excluded.description;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select
  r_sub.id,
  rp.module_id,
  rp.can_create,
  rp.can_read,
  rp.can_update,
  rp.can_delete
from public.roles r_admin
join public.roles r_sub on r_sub.name = 'sub_admin'
join public.role_permissions rp on rp.role_id = r_admin.id
join public.modules m on m.id = rp.module_id
where r_admin.name = 'admin'
  and m.slug not in (
    'movilization',
    'emails',
    'logs',
    'admins',
    'admin_roles',
    'courses',
    'reports',
    'donations',
    'orders',
    'donate'
  )
on conflict (role_id, module_id) do update set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;

-- Exclude sub_admin from the Community members directory (same as admin / super_admin).
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
    and r.name in ('local_leader', 'admin', 'super_admin', 'sub_admin')
);

comment on view public.dashboard_community_members is
  'Users with the member role who are not leaders or admins (Community members list).';
