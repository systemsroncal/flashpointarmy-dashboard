-- Chapters (top-level mobilize groups) vs Groups (subgroups people join).
-- Existing rows remain chapters (parent_group_id null).

alter table public.mobilize_groups
  add column if not exists parent_group_id uuid references public.mobilize_groups (id) on delete cascade;

alter table public.mobilize_groups
  add column if not exists schedule_meeting text;

alter table public.mobilize_groups
  add column if not exists enrollment_mode text not null default 'request_to_join';

alter table public.mobilize_groups
  drop constraint if exists mobilize_groups_enrollment_mode_check;

alter table public.mobilize_groups
  add constraint mobilize_groups_enrollment_mode_check
  check (enrollment_mode in ('request_to_join', 'open_signup', 'closed', 'auto_closed'));

alter table public.mobilize_groups
  add column if not exists last_activity_at timestamptz not null default now();

alter table public.mobilize_groups
  add column if not exists public_slug text;

create unique index if not exists idx_mobilize_groups_public_slug
  on public.mobilize_groups (public_slug)
  where public_slug is not null;

create index if not exists idx_mobilize_groups_parent
  on public.mobilize_groups (parent_group_id)
  where parent_group_id is not null;

create index if not exists idx_mobilize_groups_chapters
  on public.mobilize_groups (created_at desc)
  where parent_group_id is null;

-- Backfill enrollment from visibility for existing rows
update public.mobilize_groups
set enrollment_mode = case
  when visibility = 'public' then 'open_signup'
  else 'request_to_join'
end
where enrollment_mode = 'request_to_join'
  and visibility = 'public';

-- Auto-close inactivity window (days); super_admin editable
alter table public.mobilize_policy_settings
  add column if not exists auto_close_inactive_days integer not null default 60;

alter table public.mobilize_policy_settings
  drop constraint if exists mobilize_policy_settings_auto_close_days_check;

alter table public.mobilize_policy_settings
  add constraint mobilize_policy_settings_auto_close_days_check
  check (auto_close_inactive_days >= 1 and auto_close_inactive_days <= 3650);

comment on column public.mobilize_groups.parent_group_id is
  'Null = Chapter (principal). Set = Group (subgroup people can join).';
comment on column public.mobilize_groups.enrollment_mode is
  'request_to_join | open_signup | closed | auto_closed — subgroups only.';
comment on column public.mobilize_groups.schedule_meeting is
  'Free-text meeting schedule for subgroups (days/hours).';
