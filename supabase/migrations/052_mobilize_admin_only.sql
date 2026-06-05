-- Mobilize: visible and usable only by admin / super_admin (not local_leader or member).

update public.role_permissions rp
set
  can_create = false,
  can_read = false,
  can_update = false,
  can_delete = false
from public.roles r
join public.modules m on m.id = rp.module_id
where rp.role_id = r.id
  and m.slug = 'movilization'
  and r.name in ('local_leader', 'member');
