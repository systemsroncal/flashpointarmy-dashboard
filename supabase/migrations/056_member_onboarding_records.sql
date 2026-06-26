-- Member onboarding: coach meeting & first mission (admin-managed).

create table if not exists public.member_coach_meetings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  coach_id uuid references auth.users (id) on delete set null,
  coaching_at timestamptz,
  description text,
  observations text,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_coach_meetings_status
  on public.member_coach_meetings (status);

create table if not exists public.member_first_missions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'locked'
    check (status in ('locked', 'in_progress', 'completed')),
  tutor_id uuid references auth.users (id) on delete set null,
  description text,
  observations text,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_first_missions_status
  on public.member_first_missions (status);

alter table public.member_coach_meetings enable row level security;
alter table public.member_first_missions enable row level security;

drop policy if exists "member_coach_meetings select own or elevated" on public.member_coach_meetings;
create policy "member_coach_meetings select own or elevated" on public.member_coach_meetings
  for select to authenticated
  using (user_id = auth.uid() or public.auth_is_elevated());

drop policy if exists "member_coach_meetings insert elevated" on public.member_coach_meetings;
create policy "member_coach_meetings insert elevated" on public.member_coach_meetings
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "member_coach_meetings update elevated" on public.member_coach_meetings;
create policy "member_coach_meetings update elevated" on public.member_coach_meetings
  for update to authenticated
  using (public.auth_is_elevated())
  with check (public.auth_is_elevated());

drop policy if exists "member_first_missions select own or elevated" on public.member_first_missions;
create policy "member_first_missions select own or elevated" on public.member_first_missions
  for select to authenticated
  using (user_id = auth.uid() or public.auth_is_elevated());

drop policy if exists "member_first_missions insert elevated" on public.member_first_missions;
create policy "member_first_missions insert elevated" on public.member_first_missions
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "member_first_missions update elevated" on public.member_first_missions;
create policy "member_first_missions update elevated" on public.member_first_missions
  for update to authenticated
  using (public.auth_is_elevated())
  with check (public.auth_is_elevated());
