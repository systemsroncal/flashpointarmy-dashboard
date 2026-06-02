-- Admins: Become a Partner (donate read) + ensure broadcast (communications) and Mobilize access.
-- Donations / orders management modules remain super_admin only (see 046).

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name = 'admin'
  and m.slug = 'donate'
on conflict (role_id, module_id) do update
  set can_read = true;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'admin'
  and m.slug in ('communications', 'movilization')
on conflict (role_id, module_id) do update
  set
    can_create = excluded.can_create,
    can_read = excluded.can_read,
    can_update = excluded.can_update,
    can_delete = excluded.can_delete;
