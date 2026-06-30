-- Coach meeting / onboarding call booking fields and locked status.

alter table public.member_coach_meetings
  drop constraint if exists member_coach_meetings_status_check;

alter table public.member_coach_meetings
  add constraint member_coach_meetings_status_check
  check (status in ('locked', 'pending', 'in_progress', 'completed'));

alter table public.member_coach_meetings
  alter column status set default 'locked';

alter table public.member_coach_meetings
  add column if not exists meeting_type text not null default 'onboarding_call'
    check (meeting_type in ('coach_meeting', 'onboarding_call'));

alter table public.member_coach_meetings
  add column if not exists topic text;

alter table public.member_coach_meetings
  add column if not exists duration_minutes integer not null default 30
    check (duration_minutes > 0 and duration_minutes <= 240);

alter table public.member_coach_meetings
  add column if not exists ends_at timestamptz;

create index if not exists idx_member_coach_meetings_coaching_at
  on public.member_coach_meetings (coaching_at)
  where coaching_at is not null;

-- Members may upsert their own booking row (server validates slots).
drop policy if exists "member_coach_meetings insert own" on public.member_coach_meetings;
create policy "member_coach_meetings insert own" on public.member_coach_meetings
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "member_coach_meetings update own" on public.member_coach_meetings;
create policy "member_coach_meetings update own" on public.member_coach_meetings
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
