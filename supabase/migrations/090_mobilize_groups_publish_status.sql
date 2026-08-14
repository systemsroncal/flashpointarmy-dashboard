-- Draft groups can be saved in the dashboard but stay hidden from public listings and /g/{id}.
alter table public.mobilize_groups
  add column if not exists publish_status text not null default 'published';

alter table public.mobilize_groups
  drop constraint if exists mobilize_groups_publish_status_check;

alter table public.mobilize_groups
  add constraint mobilize_groups_publish_status_check
  check (publish_status in ('published', 'draft'));

create index if not exists mobilize_groups_publish_status_idx
  on public.mobilize_groups (publish_status);

comment on column public.mobilize_groups.publish_status is
  'published = visible in public listings and public profile; draft = dashboard-only (hidden from map, browse, and /g).';
