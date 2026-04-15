-- Align RBAC with dashboard nav: members see a narrow set of modules; local leaders lose
-- community / communications / logs and cannot add leaders (read-only Leaders).

-- Member: only national overview + gatherings + training + communications + growth (+ legacy dashboard read if present)
delete from public.role_permissions rp
using public.roles r, public.modules m
where rp.role_id = r.id
  and rp.module_id = m.id
  and r.name = 'member'
  and m.slug in (
    'chapters',
    'community',
    'leaders',
    'logs',
    'locations',
    'chaperts',
    'emails',
    'admin_roles'
  );

-- Local leader: hide community, communications, logs (emails was never seeded for leader)
delete from public.role_permissions rp
using public.roles r, public.modules m
where rp.role_id = r.id
  and rp.module_id = m.id
  and r.name = 'local_leader'
  and m.slug in ('community', 'communications', 'logs');

-- Local leader: Leaders module read-only (no inviting other leaders)
update public.role_permissions rp
set can_create = false,
    can_update = false,
    can_delete = false
from public.roles r, public.modules m
where rp.role_id = r.id
  and rp.module_id = m.id
  and r.name = 'local_leader'
  and m.slug = 'leaders';
