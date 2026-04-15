-- FlashPOINT AWS PostgreSQL migration (portable, no Supabase auth dependencies)
-- Uses public.dashboard_users as the identity table.
--
-- Run this file in your AWS PostgreSQL database.
-- Recommended extensions:
--   create extension if not exists pgcrypto; -- for gen_random_uuid()
--
-- Notes:
-- - This migration does NOT use auth.users nor auth.uid().
-- - RLS is intentionally omitted for portability; enforce access in your backend/API.
-- - Keeps same RBAC model and seed data used by the Supabase version.

create extension if not exists pgcrypto;

-- Users managed by your app/backend in AWS
create table if not exists public.dashboard_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.dashboard_users (id) on delete cascade,
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
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
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
  user_id uuid references public.dashboard_users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.dashboard_users (id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_dashboard_users_email on public.dashboard_users (lower(email));

-- Seed modules
insert into public.modules (slug, name, sort_order) values
  ('dashboard', 'Dashboard', 10),
  ('locations', 'Locations', 20),
  ('chaperts', 'Chaperts', 30),
  ('logs', 'Logs', 40),
  ('admin_roles', 'Roles & permissions', 50)
on conflict (slug) do nothing;

-- Seed roles
insert into public.roles (name, description) values
  ('super_admin', 'Full access — platform owner'),
  ('admin', 'Full access'),
  ('local_leader', 'Local leader'),
  ('member', 'Member')
on conflict (name) do nothing;

-- Permissions matrix: super_admin / admin = full CRUD on all modules
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name in ('super_admin', 'admin')
on conflict (role_id, module_id) do nothing;

-- local_leader = full read, create/update only on locations, no delete
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

-- member = read-only on selected modules
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
join public.modules m on m.slug in ('dashboard', 'locations', 'chaperts', 'logs')
where r.name = 'member'
on conflict (role_id, module_id) do nothing;

-- Auto-create profile + default member role for each new dashboard user
create or replace function public.handle_new_dashboard_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.display_name, split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  select id into rid from public.roles where name = 'member' limit 1;
  if rid is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, rid)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_dashboard_user_created on public.dashboard_users;
create trigger on_dashboard_user_created
  after insert on public.dashboard_users
  for each row execute function public.handle_new_dashboard_user();

-- Optional helper: promote by email to admin
-- usage:
--   select public.promote_user_to_admin('you@example.com');
create or replace function public.promote_user_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  select id into v_user_id
  from public.dashboard_users
  where lower(email) = lower(target_email)
  limit 1;

  if v_user_id is null then
    raise exception 'User not found for email: %', target_email;
  end if;

  select id into v_role_id
  from public.roles
  where name = 'admin'
  limit 1;

  if v_role_id is null then
    raise exception 'Role admin not found';
  end if;

  insert into public.user_roles (user_id, role_id)
  values (v_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

