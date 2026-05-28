-- Local leaders: restore Community nav + chapter-scoped member directory (removed in 016).
-- Admins: ensure Mobilize module read access (nav was super_admin-only in app code).

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, false
from public.roles r
cross join public.modules m
where r.name = 'local_leader'
  and m.slug = 'community'
on conflict (role_id, module_id) do update set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'admin'
  and m.slug = 'movilization'
on conflict (role_id, module_id) do update set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;
