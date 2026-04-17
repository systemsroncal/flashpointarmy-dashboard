-- Module: Administrators directory (who has admin / super_admin in the dashboard).

insert into public.modules (slug, name, sort_order)
values ('admins', 'Administrators', 27)
on conflict (slug) do nothing;

-- super_admin: full CRUD on admins module
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'super_admin'
  and m.slug = 'admins'
on conflict (role_id, module_id) do nothing;

-- admin (non–super-admin): read-only list of administrators
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name = 'admin'
  and m.slug = 'admins'
on conflict (role_id, module_id) do nothing;
