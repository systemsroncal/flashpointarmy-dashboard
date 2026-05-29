-- Broadcast messaging: campaign templates, sends, and logs (email + SMS).

create table if not exists public.broadcast_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email', 'sms')),
  subject text,
  body_html text,
  body_text text not null default '',
  shortcodes_help text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_broadcast_templates_channel
  on public.broadcast_templates (channel, updated_at desc);

create table if not exists public.broadcast_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  channel text not null check (channel in ('email', 'sms')),
  template_id uuid references public.broadcast_templates (id) on delete set null,
  subject text,
  body_html text,
  body_text text not null default '',
  audience jsonb not null default '{}'::jsonb,
  email_provider text not null default 'dashboard'
    check (email_provider in ('dashboard', 'brevo', 'sendgrid', 'mailchimp')),
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'failed', 'cancelled')),
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_broadcast_campaigns_status
  on public.broadcast_campaigns (status, created_at desc);

create table if not exists public.broadcast_send_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.broadcast_campaigns (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  contact text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_broadcast_send_logs_campaign
  on public.broadcast_send_logs (campaign_id, created_at desc);

alter table public.broadcast_templates enable row level security;
alter table public.broadcast_campaigns enable row level security;
alter table public.broadcast_send_logs enable row level security;

-- Admin / super_admin full access; sub_admin read-only on templates/logs, no delete.
drop policy if exists "broadcast_templates staff read" on public.broadcast_templates;
create policy "broadcast_templates staff read" on public.broadcast_templates
  for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin', 'sub_admin')
    )
  );

drop policy if exists "broadcast_templates staff write" on public.broadcast_templates;
create policy "broadcast_templates staff write" on public.broadcast_templates
  for all to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "broadcast_campaigns staff read" on public.broadcast_campaigns;
create policy "broadcast_campaigns staff read" on public.broadcast_campaigns
  for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin', 'sub_admin')
    )
  );

drop policy if exists "broadcast_campaigns staff write" on public.broadcast_campaigns;
create policy "broadcast_campaigns staff write" on public.broadcast_campaigns
  for all to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  );

drop policy if exists "broadcast_send_logs staff read" on public.broadcast_send_logs;
create policy "broadcast_send_logs staff read" on public.broadcast_send_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin', 'sub_admin')
    )
  );

drop policy if exists "broadcast_send_logs staff insert" on public.broadcast_send_logs;
create policy "broadcast_send_logs staff insert" on public.broadcast_send_logs
  for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and r.name in ('super_admin', 'admin')
    )
  );
