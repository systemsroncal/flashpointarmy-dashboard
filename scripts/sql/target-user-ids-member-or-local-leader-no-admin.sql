-- Lista user_id en public (mismo id que auth.users) para usuarios que tienen rol
-- `member` o `local_leader` y NO tienen `admin` ni `super_admin`.
--
-- Los passwords de Supabase Auth NO se pueden actualizar con SQL (hash en auth.users).
-- Usa `node scripts/bulk-flashpoint-password-members-leaders.mjs` con la service role key,
-- o el panel Emails → "Bulk default password" con la contraseña FLASHPOINT (afecta a todos
-- los no-admin; para alcance solo member/leader usa el script).

select distinct ur.user_id
from public.user_roles ur
inner join public.roles r on r.id = ur.role_id
where r.name in ('member', 'local_leader')
  and not exists (
    select 1
    from public.user_roles ur2
    inner join public.roles r2 on r2.id = ur2.role_id
    where ur2.user_id = ur.user_id
      and r2.name in ('admin', 'super_admin')
  )
order by ur.user_id;
