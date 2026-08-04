-- Roles (besides super_admin) allowed to open Mobilize / Chapters module.
-- Values: admin | sub_admin | local_leader | member
alter table public.mobilize_policy_settings
  add column if not exists chapters_viewer_roles text[] not null default '{}';

comment on column public.mobilize_policy_settings.chapters_viewer_roles is
  'Role slugs that may access Mobilize Chapters in addition to super_admin.';
