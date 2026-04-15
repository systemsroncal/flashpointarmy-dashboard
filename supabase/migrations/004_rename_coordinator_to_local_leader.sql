-- Rename legacy role coordinator → local_leader (permissions stay via role_id).
update public.roles
set
  name = 'local_leader',
  description = 'Local leader'
where name = 'coordinator';
