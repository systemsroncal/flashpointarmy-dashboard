-- Dashboard announcements (admin-managed) + per-user read / dismiss.
-- Visible while expires_at is null or expires_at > now(); pruned via function.

create table if not exists public.dashboard_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  expires_at timestamptz,
  read_more_collapsed boolean not null default false,
  ctas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  constraint dashboard_announcements_ctas_array check (jsonb_typeof(ctas) = 'array')
);

create index if not exists idx_dashboard_announcements_created_desc
  on public.dashboard_announcements (created_at desc);
create index if not exists idx_dashboard_announcements_expires
  on public.dashboard_announcements (expires_at)
  where expires_at is not null;

create table if not exists public.announcement_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  announcement_id uuid not null references public.dashboard_announcements (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create table if not exists public.announcement_dismissed (
  user_id uuid not null references auth.users (id) on delete cascade,
  announcement_id uuid not null references public.dashboard_announcements (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, announcement_id)
);

create index if not exists idx_announcement_reads_user on public.announcement_reads (user_id);
create index if not exists idx_announcement_dismissed_user on public.announcement_dismissed (user_id);

alter table public.dashboard_announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.announcement_dismissed enable row level security;

-- Visible rows: not expired (or no expiry)
drop policy if exists "dashboard_announcements select visible" on public.dashboard_announcements;
create policy "dashboard_announcements select visible" on public.dashboard_announcements
  for select to authenticated
  using (expires_at is null or expires_at > now());

drop policy if exists "dashboard_announcements admin insert" on public.dashboard_announcements;
create policy "dashboard_announcements admin insert" on public.dashboard_announcements
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "dashboard_announcements admin update" on public.dashboard_announcements;
create policy "dashboard_announcements admin update" on public.dashboard_announcements
  for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "dashboard_announcements admin delete" on public.dashboard_announcements;
create policy "dashboard_announcements admin delete" on public.dashboard_announcements
  for delete to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "announcement_reads own" on public.announcement_reads;
create policy "announcement_reads own" on public.announcement_reads
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "announcement_dismissed own" on public.announcement_dismissed;
create policy "announcement_dismissed own" on public.announcement_dismissed
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Remove expired rows (call from app or pg_cron if configured)
create or replace function public.prune_expired_dashboard_announcements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.dashboard_announcements
  where expires_at is not null and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function public.prune_expired_dashboard_announcements() to authenticated;
