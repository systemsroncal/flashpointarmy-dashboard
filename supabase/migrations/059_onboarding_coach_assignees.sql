-- Assignable coaches for onboarding meetings (configured in Settings).

create table if not exists public.onboarding_coach_assignees (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_coach_assignees_sort
  on public.onboarding_coach_assignees (sort_order, created_at);

alter table public.onboarding_coach_assignees enable row level security;

drop policy if exists "onboarding_coach_assignees select authenticated" on public.onboarding_coach_assignees;
create policy "onboarding_coach_assignees select authenticated" on public.onboarding_coach_assignees
  for select to authenticated
  using (true);

drop policy if exists "onboarding_coach_assignees insert elevated" on public.onboarding_coach_assignees;
create policy "onboarding_coach_assignees insert elevated" on public.onboarding_coach_assignees
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "onboarding_coach_assignees update elevated" on public.onboarding_coach_assignees;
create policy "onboarding_coach_assignees update elevated" on public.onboarding_coach_assignees
  for update to authenticated
  using (public.auth_is_elevated())
  with check (public.auth_is_elevated());

drop policy if exists "onboarding_coach_assignees delete elevated" on public.onboarding_coach_assignees;
create policy "onboarding_coach_assignees delete elevated" on public.onboarding_coach_assignees
  for delete to authenticated
  using (public.auth_is_elevated());
