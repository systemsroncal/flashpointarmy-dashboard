-- Restrict donations / orders / donate modules to super_admin only.
-- Idempotent: safe to apply even if 045 was applied earlier with broader grants.

delete from public.role_permissions rp
using public.modules m, public.roles r
where rp.module_id = m.id
  and rp.role_id = r.id
  and m.slug in ('donations', 'orders', 'donate')
  and r.name <> 'super_admin';

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id,
  case when m.slug = 'donations' then true else false end,
  true,
  case when m.slug = 'donations' then true else false end,
  case when m.slug = 'donations' then true else false end
from public.roles r
cross join public.modules m
where r.name = 'super_admin'
  and m.slug in ('donations', 'orders', 'donate')
on conflict (role_id, module_id) do nothing;
