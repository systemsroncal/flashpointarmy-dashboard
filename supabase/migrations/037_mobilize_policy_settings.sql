-- Who may create Mobilize groups (admins / super_admins always can in app code).
create table if not exists public.mobilize_policy_settings (
  id smallint primary key default 1 constraint mobilize_policy_settings_singleton check (id = 1),
  allow_member_group_create boolean not null default false,
  allow_local_leader_group_create boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.mobilize_policy_settings (id) values (1)
on conflict (id) do nothing;

alter table public.mobilize_policy_settings enable row level security;

drop policy if exists "mobilize_policy_settings_select_authenticated" on public.mobilize_policy_settings;
create policy "mobilize_policy_settings_select_authenticated" on public.mobilize_policy_settings
  for select to authenticated using (true);

drop policy if exists "mobilize_policy_settings_update_super_admin" on public.mobilize_policy_settings;
create policy "mobilize_policy_settings_update_super_admin" on public.mobilize_policy_settings
  for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'super_admin'
    )
  )
  with check (true);

drop policy if exists "mobilize_policy_settings_insert_super_admin" on public.mobilize_policy_settings;
create policy "mobilize_policy_settings_insert_super_admin" on public.mobilize_policy_settings
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name = 'super_admin'
    )
  );
