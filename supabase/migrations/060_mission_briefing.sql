-- Mission Briefing (member onboarding step 2): admin-configurable video + watch progress.

alter table public.training_settings
  add column if not exists briefing_video_url text;

comment on column public.training_settings.briefing_video_url is
  'Onboarding Mission Briefing video URL for members. Falls back to welcome video when empty.';

create table if not exists public.member_mission_briefing_progress (
  user_id uuid primary key references public.dashboard_users (id) on delete cascade,
  video_position_seconds double precision not null default 0,
  video_duration_seconds double precision,
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_mission_briefing_progress_updated
  on public.member_mission_briefing_progress (updated_at desc);

alter table public.member_mission_briefing_progress enable row level security;

drop policy if exists "member_mission_briefing_progress select own" on public.member_mission_briefing_progress;
create policy "member_mission_briefing_progress select own" on public.member_mission_briefing_progress
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "member_mission_briefing_progress insert own" on public.member_mission_briefing_progress;
create policy "member_mission_briefing_progress insert own" on public.member_mission_briefing_progress
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "member_mission_briefing_progress update own" on public.member_mission_briefing_progress;
create policy "member_mission_briefing_progress update own" on public.member_mission_briefing_progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "member_mission_briefing_progress select admin" on public.member_mission_briefing_progress;
create policy "member_mission_briefing_progress select admin" on public.member_mission_briefing_progress
  for select to authenticated using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin', 'sub_admin')
    )
  );
