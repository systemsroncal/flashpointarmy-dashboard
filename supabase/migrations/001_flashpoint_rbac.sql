-- FlashPOINT: module RBAC + CRUD, audit log, notifications.
--
-- TABLES NOT SHOWING IN DASHBOARD? This file must be executed once:
-- Supabase Dashboard → SQL → New query → paste this entire file → Run.
-- Then refresh Database → Tables. See also ../RUN_IN_SQL_EDITOR.txt
--
-- Same schema can be reused on AWS PostgreSQL with your own auth layer.

-- Perfiles (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int default 0
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  can_create boolean not null default false,
  can_read boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  unique (role_id, module_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.locations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Basic RLS (tighten for production)
-- Idempotent: safe if tables/policies already exist (e.g. manual SQL + db push).
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "modules read authenticated" on public.modules;
create policy "modules read authenticated" on public.modules
  for select to authenticated using (true);

drop policy if exists "roles read authenticated" on public.roles;
create policy "roles read authenticated" on public.roles
  for select to authenticated using (true);

drop policy if exists "role_permissions read authenticated" on public.role_permissions;
create policy "role_permissions read authenticated" on public.role_permissions
  for select to authenticated using (true);

drop policy if exists "user_roles read self" on public.user_roles;
create policy "user_roles read self" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "locations authenticated crud" on public.locations;
create policy "locations authenticated crud" on public.locations
  for all to authenticated using (true) with check (true);

drop policy if exists "audit_logs read authenticated" on public.audit_logs;
create policy "audit_logs read authenticated" on public.audit_logs
  for select to authenticated using (true);

drop policy if exists "audit_logs insert authenticated" on public.audit_logs;
create policy "audit_logs insert authenticated" on public.audit_logs
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "notifications own" on public.notifications;
create policy "notifications own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime: Supabase → Database → Replication → enable `notifications`
-- alter publication supabase_realtime add table public.notifications;

insert into public.modules (slug, name, sort_order) values
  ('dashboard', 'Dashboard', 10),
  ('locations', 'Locations', 20),
  ('chaperts', 'Chaperts', 30),
  ('logs', 'Logs', 40),
  ('admin_roles', 'Roles & permissions', 50)
on conflict (slug) do nothing;

insert into public.roles (name, description) values
  ('admin', 'Full access'),
  ('local_leader', 'Local leader'),
  ('member', 'Member')
on conflict (name) do nothing;

-- Sample matrix: admin = full CRUD on all modules
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'admin'
on conflict (role_id, module_id) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id,
  case when m.slug = 'locations' then true else false end,
  true,
  case when m.slug = 'locations' then true else false end,
  false
from public.roles r
cross join public.modules m
where r.name = 'local_leader' and m.slug <> 'admin_roles'
on conflict (role_id, module_id) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
join public.modules m on m.slug in ('dashboard', 'locations', 'chaperts', 'logs')
where r.name = 'member'
on conflict (role_id, module_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  select id into rid from public.roles where name = 'member' limit 1;
  if rid is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, rid)
    on conflict (user_id, role_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
