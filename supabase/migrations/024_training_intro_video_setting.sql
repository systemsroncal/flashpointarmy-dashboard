-- Training landing: intro video URL editable by admins (fallback: NEXT_PUBLIC_TRAINING_INTRO_VIDEO).
create table if not exists public.training_settings (
  id smallint primary key default 1 constraint training_settings_singleton check (id = 1),
  intro_video_url text,
  updated_at timestamptz not null default now()
);

insert into public.training_settings (id, intro_video_url) values (1, null)
on conflict (id) do nothing;

alter table public.training_settings enable row level security;

drop policy if exists "training_settings_select_authenticated" on public.training_settings;
create policy "training_settings_select_authenticated" on public.training_settings
  for select to authenticated using (true);

drop policy if exists "training_settings_update_admin" on public.training_settings;
create policy "training_settings_update_admin" on public.training_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  )
  with check (true);

drop policy if exists "training_settings_insert_admin" on public.training_settings;
create policy "training_settings_insert_admin" on public.training_settings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );
