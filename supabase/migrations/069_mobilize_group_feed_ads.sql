-- Configurable sidebar ads for Mobilize group feed (right rail).
alter table public.mobilize_policy_settings
  add column if not exists group_feed_ads jsonb not null default '[]'::jsonb;

comment on column public.mobilize_policy_settings.group_feed_ads is
  'Ordered blocks (image, carousel, rich_text) for the group feed right sidebar.';
