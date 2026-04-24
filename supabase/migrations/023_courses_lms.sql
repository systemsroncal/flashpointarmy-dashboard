-- LMS: courses, sessions, elements, progress, quiz results; module `courses` for admin UI.

create or replace function public.auth_is_elevated()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name in ('super_admin', 'admin')
  );
$$;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text,
  description_html text,
  intro_video_url text,
  author_user_id uuid references public.dashboard_users (id) on delete set null,
  author_display_name text,
  applies_grades boolean not null default false,
  published boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  title text not null,
  subtitle text,
  cover_image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, slug)
);

create index if not exists idx_course_sessions_course_sort on public.course_sessions (course_id, sort_order);

create table if not exists public.course_elements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  sort_order int not null default 0,
  element_type text not null check (element_type in (
    'plain_text', 'rich_text', 'video', 'pdf', 'image', 'quiz'
  )),
  title_html text,
  description_html text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_elements_session_sort on public.course_elements (session_id, sort_order);

create table if not exists public.course_session_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  completed_at timestamptz,
  video_positions jsonb not null default '{}'::jsonb,
  primary key (user_id, session_id)
);

create table if not exists public.course_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  element_id uuid not null references public.course_elements (id) on delete cascade,
  score numeric not null,
  max_score numeric not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  unique (user_id, element_id)
);

alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.course_elements enable row level security;
alter table public.course_session_progress enable row level security;
alter table public.course_quiz_results enable row level security;

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses
  for select to authenticated
  using (published = true or public.auth_is_elevated());

drop policy if exists "courses_insert" on public.courses;
create policy "courses_insert" on public.courses
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "courses_update" on public.courses;
create policy "courses_update" on public.courses
  for update to authenticated
  using (public.auth_is_elevated());

drop policy if exists "courses_delete" on public.courses;
create policy "courses_delete" on public.courses
  for delete to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_sessions_select" on public.course_sessions;
create policy "course_sessions_select" on public.course_sessions
  for select to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.published = true or public.auth_is_elevated())
    )
  );

drop policy if exists "course_sessions_insert" on public.course_sessions;
create policy "course_sessions_insert" on public.course_sessions
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "course_sessions_update" on public.course_sessions;
create policy "course_sessions_update" on public.course_sessions
  for update to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_sessions_delete" on public.course_sessions;
create policy "course_sessions_delete" on public.course_sessions
  for delete to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_elements_select" on public.course_elements;
create policy "course_elements_select" on public.course_elements
  for select to authenticated
  using (
    exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = session_id
        and (c.published = true or public.auth_is_elevated())
    )
  );

drop policy if exists "course_elements_insert" on public.course_elements;
create policy "course_elements_insert" on public.course_elements
  for insert to authenticated
  with check (public.auth_is_elevated());

drop policy if exists "course_elements_update" on public.course_elements;
create policy "course_elements_update" on public.course_elements
  for update to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_elements_delete" on public.course_elements;
create policy "course_elements_delete" on public.course_elements
  for delete to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_session_progress_select" on public.course_session_progress;
create policy "course_session_progress_select" on public.course_session_progress
  for select to authenticated
  using (user_id = auth.uid() or public.auth_is_elevated());

drop policy if exists "course_session_progress_insert" on public.course_session_progress;
create policy "course_session_progress_insert" on public.course_session_progress
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = session_id
        and (c.published = true or public.auth_is_elevated())
    )
  );

drop policy if exists "course_session_progress_update" on public.course_session_progress;
create policy "course_session_progress_update" on public.course_session_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_sessions s
      join public.courses c on c.id = s.course_id
      where s.id = session_id
        and (c.published = true or public.auth_is_elevated())
    )
  );

drop policy if exists "course_session_progress_delete" on public.course_session_progress;
create policy "course_session_progress_delete" on public.course_session_progress
  for delete to authenticated
  using (public.auth_is_elevated());

drop policy if exists "course_quiz_results_select" on public.course_quiz_results;
create policy "course_quiz_results_select" on public.course_quiz_results
  for select to authenticated
  using (user_id = auth.uid() or public.auth_is_elevated());

drop policy if exists "course_quiz_results_insert" on public.course_quiz_results;
create policy "course_quiz_results_insert" on public.course_quiz_results
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.course_elements e
      join public.course_sessions s on s.id = e.session_id
      join public.courses c on c.id = s.course_id
      where e.id = element_id
        and (c.published = true or public.auth_is_elevated())
    )
  );

drop policy if exists "course_quiz_results_update" on public.course_quiz_results;
create policy "course_quiz_results_update" on public.course_quiz_results
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "course_quiz_results_delete" on public.course_quiz_results;
create policy "course_quiz_results_delete" on public.course_quiz_results
  for delete to authenticated
  using (public.auth_is_elevated());

-- Module: Courses (admin builder + enrollment analytics)
insert into public.modules (slug, name, sort_order)
values ('courses', 'Courses', 58)
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'super_admin'
  and m.slug = 'courses'
on conflict (role_id, module_id) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name = 'admin'
  and m.slug = 'courses'
on conflict (role_id, module_id) do nothing;

-- Demo course: Biblical Citizenship (8 sessions, sequential)
insert into public.courses (
  id, title, slug, subtitle, description_html,
  author_display_name, applies_grades, published, created_at, updated_at
)
values (
  'a1000000-0000-4000-8000-000000000001',
  'Biblical Citizenship',
  'biblical-citizenship',
  'FlashPoint Army Training Command',
  '<p>Equipping believers to understand liberty, think critically, and engage their communities.</p>',
  'FlashPoint Team',
  true,
  true,
  now(),
  now()
)
on conflict (slug) do nothing;

insert into public.course_sessions (course_id, slug, title, subtitle, sort_order)
select c.id, v.slug, v.title, v.subtitle, v.sort_order
from public.courses c
cross join (values
  ('the-foundation', 'The Foundation.', 'Session 1', 0),
  ('tending-the-garden', 'Tending the Garden.', 'Session 2', 1),
  ('understanding-the-times', 'Understanding the Times.', 'Session 3', 2),
  ('the-seeds-of-liberty', 'The Seeds of Liberty.', 'Session 4', 3),
  ('who-has-authority', 'Who Has Authority.', 'Session 5', 4),
  ('of-kings-and-courts', 'Of Kings and Courts.', 'Session 6', 5),
  ('religious-liberty', 'Religious Liberty.', 'Session 7', 6),
  ('salt-and-light', 'Salt & Light.', 'Session 8', 7)
) as v(slug, title, subtitle, sort_order)
where c.slug = 'biblical-citizenship'
on conflict (course_id, slug) do nothing;