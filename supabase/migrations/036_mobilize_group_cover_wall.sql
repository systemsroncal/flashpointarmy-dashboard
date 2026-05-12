-- Group cover image, wall posting policy, per-message comment visibility (for future / display).

alter table public.mobilize_groups
  add column if not exists cover_image_url text;

alter table public.mobilize_groups
  add column if not exists wall_post_policy text not null default 'all_approved'
  check (wall_post_policy in ('all_approved', 'leaders_only'));

comment on column public.mobilize_groups.wall_post_policy is
  'all_approved: any approved member may post on wall; leaders_only: only leaders may post.';

alter table public.mobilize_group_messages
  add column if not exists comments_policy text not null default 'everyone'
  check (comments_policy in ('everyone', 'leaders_only'));

comment on column public.mobilize_group_messages.comments_policy is
  'Reserved for threaded comments / display: everyone vs leaders_only. Member posts default everyone.';
