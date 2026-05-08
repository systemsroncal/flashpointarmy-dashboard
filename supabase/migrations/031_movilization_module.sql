-- Sidebar module: Movilization (red accent in app; slug must match MODULE_SLUGS.movilization)

insert into public.modules (slug, name, sort_order)
values ('movilization', 'Movilization', 46)
on conflict (slug) do nothing;

-- super_admin / admin: full access (same pattern as other platform modules)
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name in ('super_admin', 'admin')
  and m.slug = 'movilization'
on conflict (role_id, module_id) do nothing;

-- local_leader: read-only in nav (content TBD)
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name = 'local_leader'
  and m.slug = 'movilization'
on conflict (role_id, module_id) do nothing;

-- member: read (shown with other member modules)
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name = 'member'
  and m.slug = 'movilization'
on conflict (role_id, module_id) do nothing;
