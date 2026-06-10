-- Attach images to Mobilize group announcements (wall posts).

alter table public.mobilize_group_messages
  add column if not exists image_urls text[] not null default '{}';

comment on column public.mobilize_group_messages.image_urls is
  'Public web paths (/uploads/mobilize-announcements/...) attached to the announcement.';
