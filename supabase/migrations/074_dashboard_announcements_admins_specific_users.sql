-- Admins audience + multi-user targeting for Mission Updates.

alter table public.dashboard_announcements
  drop constraint if exists dashboard_announcements_audience_check;

alter table public.dashboard_announcements
  add constraint dashboard_announcements_audience_check
  check (audience in ('everyone', 'leaders', 'members', 'admins', 'specific_users'));

create table if not exists public.dashboard_announcement_recipients (
  announcement_id uuid not null references public.dashboard_announcements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (announcement_id, user_id)
);

create index if not exists idx_dashboard_announcement_recipients_user
  on public.dashboard_announcement_recipients (user_id, announcement_id);

alter table public.dashboard_announcement_recipients enable row level security;

drop policy if exists "dashboard_announcement_recipients select own or admin" on public.dashboard_announcement_recipients;
create policy "dashboard_announcement_recipients select own or admin" on public.dashboard_announcement_recipients
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "dashboard_announcements select visible" on public.dashboard_announcements;
create policy "dashboard_announcements select visible" on public.dashboard_announcements
  for select to authenticated
  using (
    (expires_at is null or expires_at > now())
    and (
      (target_user_id is not null and target_user_id = auth.uid())
      or (
        target_user_id is null
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
          or (
            audience = 'admins'
            and exists (
              select 1
              from public.user_roles ur
              join public.roles r on r.id = ur.role_id
              where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin', 'sub_admin')
            )
          )
          or (
            audience = 'specific_users'
            and exists (
              select 1
              from public.dashboard_announcement_recipients dar
              where dar.announcement_id = dashboard_announcements.id
                and dar.user_id = auth.uid()
            )
          )
          or exists (
            select 1
            from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
          )
        )
      )
    )
  );
