-- Pin group feed posts to the top (leaders / admins / super admins).

alter table public.mobilize_group_messages
  add column if not exists pinned_at timestamptz;

create index if not exists idx_mobilize_group_messages_group_pinned
  on public.mobilize_group_messages (group_id, pinned_at desc nulls last, created_at desc);
