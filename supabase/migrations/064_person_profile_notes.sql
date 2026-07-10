-- Staff notes on person profiles (People → profile page).

create table if not exists public.person_profile_notes (
  id uuid primary key default gen_random_uuid(),
  person_user_id uuid not null references auth.users (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_profile_notes_body_len check (char_length(trim(body)) >= 1 and char_length(body) <= 8000)
);

create index if not exists idx_person_profile_notes_person
  on public.person_profile_notes (person_user_id, created_at desc);

alter table public.person_profile_notes enable row level security;

drop policy if exists "person_profile_notes_staff_select" on public.person_profile_notes;
create policy "person_profile_notes_staff_select"
  on public.person_profile_notes for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('admin', 'super_admin', 'sub_admin')
    )
  );

drop policy if exists "person_profile_notes_staff_insert" on public.person_profile_notes;
create policy "person_profile_notes_staff_insert"
  on public.person_profile_notes for insert to authenticated
  with check (
    author_user_id = auth.uid()
    and exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('admin', 'super_admin', 'sub_admin')
    )
  );

drop policy if exists "person_profile_notes_staff_update" on public.person_profile_notes;
create policy "person_profile_notes_staff_update"
  on public.person_profile_notes for update to authenticated
  using (
    author_user_id = auth.uid()
    and exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('admin', 'super_admin', 'sub_admin')
    )
  )
  with check (
    author_user_id = auth.uid()
  );

drop policy if exists "person_profile_notes_staff_delete" on public.person_profile_notes;
create policy "person_profile_notes_staff_delete"
  on public.person_profile_notes for delete to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('admin', 'super_admin', 'sub_admin')
    )
  );
