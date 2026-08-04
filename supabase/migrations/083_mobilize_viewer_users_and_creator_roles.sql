-- Specific users whitelist for Mobilize Chapters viewing (in addition to role list).
alter table public.mobilize_policy_settings
  add column if not exists chapters_viewer_user_ids uuid[] not null default '{}';

comment on column public.mobilize_policy_settings.chapters_viewer_user_ids is
  'User IDs explicitly allowed to open Mobilize Chapters (whitelist), in addition to chapters_viewer_roles and super_admin.';

-- Role slugs allowed to create Mobilize chapters & groups (besides super_admin).
-- Values: admin | sub_admin | local_leader | member
alter table public.mobilize_policy_settings
  add column if not exists group_creator_roles text[] not null default '{admin,sub_admin,local_leader}';

comment on column public.mobilize_policy_settings.group_creator_roles is
  'Role slugs that may create Mobilize chapters & groups, in addition to super_admin.';

-- Backfill creator roles from legacy boolean flags.
update public.mobilize_policy_settings
set group_creator_roles = array_remove(
  array[
    'admin',
    'sub_admin',
    case when coalesce(allow_local_leader_group_create, true) then 'local_leader' else null end,
    case when coalesce(allow_member_group_create, false) then 'member' else null end
  ],
  null
)
where id = 1;
