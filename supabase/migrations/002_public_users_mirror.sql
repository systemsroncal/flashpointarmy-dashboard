-- Mirror auth.users into public.dashboard_users for development portability.
-- Supabase Auth remains source of truth; this table aligns with the AWS portable schema name.

-- Remove legacy mirror if a previous iteration created public.users
drop trigger if exists on_auth_user_sync_public_users on auth.users;
drop trigger if exists on_auth_user_sync_dashboard_users on auth.users;
drop function if exists public.sync_public_users_from_auth();
drop function if exists public.sync_dashboard_users_from_auth();
drop table if exists public.users cascade;

create table if not exists public.dashboard_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dashboard_users_email_lower on public.dashboard_users (lower(email));

alter table public.dashboard_users enable row level security;

drop policy if exists "dashboard_users self read" on public.dashboard_users;
create policy "dashboard_users self read" on public.dashboard_users
  for select to authenticated using (auth.uid() = id);

drop policy if exists "dashboard_users self update" on public.dashboard_users;
create policy "dashboard_users self update" on public.dashboard_users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.sync_dashboard_users_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dashboard_users (id, email, display_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_sync_dashboard_users on auth.users;
create trigger on_auth_user_sync_dashboard_users
  after insert or update on auth.users
  for each row execute function public.sync_dashboard_users_from_auth();

-- Backfill already existing auth users.
insert into public.dashboard_users (id, email, display_name, created_at, updated_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  updated_at = now();
