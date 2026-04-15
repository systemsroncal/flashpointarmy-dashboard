-- Email module: branding + templates + secure token links + gathering audience scope.

create table if not exists public.email_branding_settings (
  id boolean primary key default true,
  logo_url text,
  logo_bg_color text not null default '#111111',
  container_bg_color text not null default '#0b0b0d',
  footer_html text not null default '<p style="margin:0">© {current_year} Flashpoint Army</p>',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.email_branding_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  subject text not null,
  body_html text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.email_templates (template_key, subject, body_html)
values
  ('verify_email', 'Verify your email', '<p>Hello {user_fullname},</p><p>Click to verify your email:</p><p><a href="{validateemail_url}">{validateemail_url}</a></p>'),
  ('password_reset', 'Reset your password', '<p>Hello {user_fullname},</p><p>Click to reset your password:</p><p><a href="{resetpassword_url}">{resetpassword_url}</a></p>'),
  ('local_leader_assigned', 'You were assigned as Local Leader', '<p>Hello {user_fullname},</p><p>Your role was updated to <strong>Local leader</strong>.</p>'),
  ('gathering_created', 'New gathering available', '<p>Hello {user_fullname},</p><p>A new event is available: <strong>{gathering_title}</strong></p><p><a href="{gathering_url}">View event</a></p>')
on conflict (template_key) do nothing;

create table if not exists public.email_action_tokens (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  token_hash text not null,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_action_tokens_lookup
  on public.email_action_tokens (action, lower(email), expires_at)
  where consumed_at is null;

alter table public.email_branding_settings enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_action_tokens enable row level security;

drop policy if exists "email_branding authenticated read" on public.email_branding_settings;
create policy "email_branding authenticated read" on public.email_branding_settings
  for select to authenticated using (true);

drop policy if exists "email_branding admin update" on public.email_branding_settings;
create policy "email_branding admin update" on public.email_branding_settings
  for all to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "email_templates authenticated read" on public.email_templates;
create policy "email_templates authenticated read" on public.email_templates
  for select to authenticated using (true);

drop policy if exists "email_templates admin update" on public.email_templates;
create policy "email_templates admin update" on public.email_templates
  for all to authenticated
  using (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "email_action_tokens no direct access" on public.email_action_tokens;
create policy "email_action_tokens no direct access" on public.email_action_tokens
  for all to authenticated using (false) with check (false);

alter table public.gatherings
  add column if not exists audience_scope text not null default 'chapter'
  check (audience_scope in ('chapter', 'all'));

insert into public.modules (slug, name, sort_order)
values ('emails', 'Emails', 85)
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
join public.modules m on m.slug = 'emails'
where r.name in ('super_admin', 'admin')
on conflict (role_id, module_id) do nothing;
