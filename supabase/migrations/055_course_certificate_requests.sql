-- External training certificate requests (completed at another org/chapter).

create table if not exists public.course_certificate_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  completed_training_confirmed boolean not null default true,
  completion_date date not null,
  organization_name text not null,
  certificate_url text not null,
  certificate_file_name text,
  certificate_mime text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_certificate_requests_status_created
  on public.course_certificate_requests (status, created_at desc);

create index if not exists idx_course_certificate_requests_user_course
  on public.course_certificate_requests (user_id, course_id, created_at desc);

alter table public.course_certificate_requests enable row level security;

drop policy if exists "course_certificate_requests select own or elevated" on public.course_certificate_requests;
create policy "course_certificate_requests select own or elevated" on public.course_certificate_requests
  for select to authenticated
  using (user_id = auth.uid() or public.auth_is_elevated());

drop policy if exists "course_certificate_requests insert own" on public.course_certificate_requests;
create policy "course_certificate_requests insert own" on public.course_certificate_requests
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "course_certificate_requests update elevated" on public.course_certificate_requests;
create policy "course_certificate_requests update elevated" on public.course_certificate_requests
  for update to authenticated
  using (public.auth_is_elevated())
  with check (public.auth_is_elevated());
