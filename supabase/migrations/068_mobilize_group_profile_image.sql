-- Group profile avatar (separate from cover banner).

alter table public.mobilize_groups
  add column if not exists profile_image_url text;

comment on column public.mobilize_groups.profile_image_url is
  'Circular profile image for group/subgroup; cover_image_url remains the banner.';
