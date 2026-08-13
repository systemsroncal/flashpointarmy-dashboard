-- Custom notifications on group "Group updates" tab + who may manage them.

alter table public.mobilize_policy_settings
  add column if not exists group_updates_allow_group_leaders boolean not null default true;

comment on column public.mobilize_policy_settings.group_updates_allow_group_leaders is
  'When true, approved group leaders may CRUD custom Group updates notifications. Super admins always can.';

create table if not exists public.mobilize_group_update_notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  title text not null,
  body text not null default '',
  body_html text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobilize_group_update_notifications_title_len check (char_length(trim(title)) between 1 and 200)
);

create index if not exists idx_mobilize_group_update_notifications_group_created
  on public.mobilize_group_update_notifications (group_id, created_at desc);

alter table public.mobilize_group_update_notifications enable row level security;

-- Reads go through service-role API; keep authenticated select for approved members / super admins.
drop policy if exists "mobilize_group_update_notifications_select" on public.mobilize_group_update_notifications;
create policy "mobilize_group_update_notifications_select"
  on public.mobilize_group_update_notifications
  for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'super_admin'
    )
    or exists (
      select 1
      from public.mobilize_group_members m
      where m.group_id = mobilize_group_update_notifications.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

-- Mutations are performed with the service-role admin client in API routes.
drop policy if exists "mobilize_group_update_notifications_no_direct_write" on public.mobilize_group_update_notifications;
create policy "mobilize_group_update_notifications_no_direct_write"
  on public.mobilize_group_update_notifications
  for all to authenticated
  using (false)
  with check (false);
