-- Personal dashboard announcements (e.g. certificate request reviewed) for a single user.

alter table public.dashboard_announcements
  add column if not exists target_user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_dashboard_announcements_target_user
  on public.dashboard_announcements (target_user_id, created_at desc)
  where target_user_id is not null;

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
