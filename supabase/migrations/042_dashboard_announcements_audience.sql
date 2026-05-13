-- Who can see each dashboard announcement: everyone, leaders (local_leader), or members (member without local_leader).
-- Admins and super admins always match the SELECT policy so they can manage all rows.

alter table public.dashboard_announcements
  add column if not exists audience text not null default 'everyone';

alter table public.dashboard_announcements
  drop constraint if exists dashboard_announcements_audience_check;

alter table public.dashboard_announcements
  add constraint dashboard_announcements_audience_check
  check (audience in ('everyone', 'leaders', 'members'));

-- Replace SELECT policy with audience-aware rules (still non-expired only).
drop policy if exists "dashboard_announcements select visible" on public.dashboard_announcements;
create policy "dashboard_announcements select visible" on public.dashboard_announcements
  for select to authenticated
  using (
    (expires_at is null or expires_at > now())
    and (
      audience = 'everyone'
      or (
        audience = 'leaders'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = auth.uid() and r.name = 'local_leader'
        )
      )
      or (
        audience = 'members'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = auth.uid() and r.name = 'member'
        )
        and not exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = auth.uid() and r.name = 'local_leader'
        )
      )
      or exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
      )
    )
  );

-- Reads / dismiss: only for announcements the user is allowed to see (inherits announcement SELECT RLS in subquery).
drop policy if exists "announcement_reads own" on public.announcement_reads;
create policy "announcement_reads select own" on public.announcement_reads
  for select to authenticated
  using (auth.uid() = user_id);

create policy "announcement_reads insert own" on public.announcement_reads
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dashboard_announcements da where da.id = announcement_id)
  );

create policy "announcement_reads update own" on public.announcement_reads
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dashboard_announcements da where da.id = announcement_id)
  );

create policy "announcement_reads delete own" on public.announcement_reads
  for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "announcement_dismissed own" on public.announcement_dismissed;
create policy "announcement_dismissed select own" on public.announcement_dismissed
  for select to authenticated
  using (auth.uid() = user_id);

create policy "announcement_dismissed insert own" on public.announcement_dismissed
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dashboard_announcements da where da.id = announcement_id)
  );

create policy "announcement_dismissed update own" on public.announcement_dismissed
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.dashboard_announcements da where da.id = announcement_id)
  );

create policy "announcement_dismissed delete own" on public.announcement_dismissed
  for delete to authenticated
  using (auth.uid() = user_id);
