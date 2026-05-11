-- Reports: analytics charts (admin / super_admin only).

insert into public.modules (slug, name, sort_order)
values ('reports', 'Reports', 48)
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name in ('super_admin', 'admin')
  and m.slug = 'reports'
on conflict (role_id, module_id) do nothing;
