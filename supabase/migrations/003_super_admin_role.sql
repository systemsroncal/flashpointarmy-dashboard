-- Platform owner role: full CRUD on every module (same matrix as admin).

insert into public.roles (name, description) values
  ('super_admin', 'Full access — platform owner')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'super_admin'
on conflict (role_id, module_id) do nothing;
