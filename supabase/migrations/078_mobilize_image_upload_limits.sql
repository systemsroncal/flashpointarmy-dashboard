-- Configurable image upload limits for Mobilize Groups wall posts and User profile posts.
alter table public.mobilize_policy_settings
  add column if not exists groups_image_max_mb numeric(6, 2) not null default 1,
  add column if not exists groups_image_max_count integer not null default 4,
  add column if not exists profile_image_max_mb numeric(6, 2) not null default 1,
  add column if not exists profile_image_max_count integer not null default 4;

alter table public.mobilize_policy_settings
  drop constraint if exists mobilize_policy_settings_groups_image_max_mb_check;
alter table public.mobilize_policy_settings
  add constraint mobilize_policy_settings_groups_image_max_mb_check
  check (groups_image_max_mb >= 0.1 and groups_image_max_mb <= 50);

alter table public.mobilize_policy_settings
  drop constraint if exists mobilize_policy_settings_groups_image_max_count_check;
alter table public.mobilize_policy_settings
  add constraint mobilize_policy_settings_groups_image_max_count_check
  check (groups_image_max_count >= 1 and groups_image_max_count <= 20);

alter table public.mobilize_policy_settings
  drop constraint if exists mobilize_policy_settings_profile_image_max_mb_check;
alter table public.mobilize_policy_settings
  add constraint mobilize_policy_settings_profile_image_max_mb_check
  check (profile_image_max_mb >= 0.1 and profile_image_max_mb <= 50);

alter table public.mobilize_policy_settings
  drop constraint if exists mobilize_policy_settings_profile_image_max_count_check;
alter table public.mobilize_policy_settings
  add constraint mobilize_policy_settings_profile_image_max_count_check
  check (profile_image_max_count >= 1 and profile_image_max_count <= 20);

comment on column public.mobilize_policy_settings.groups_image_max_mb is
  'Max size in MB for each image uploaded to Mobilize group walls.';
comment on column public.mobilize_policy_settings.groups_image_max_count is
  'Max images per Mobilize group wall post.';
comment on column public.mobilize_policy_settings.profile_image_max_mb is
  'Max size in MB for each image uploaded to Mobilize user profile posts.';
comment on column public.mobilize_policy_settings.profile_image_max_count is
  'Max images per Mobilize user profile post.';
