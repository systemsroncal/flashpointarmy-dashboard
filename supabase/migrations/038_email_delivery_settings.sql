-- Gmail / Google Workspace OAuth + optional env SMTP (see app email delivery logic).
create table if not exists public.email_delivery_settings (
  id boolean primary key default true,
  provider text not null default 'env_smtp'
    check (provider in ('env_smtp', 'gmail_workspace_oauth')),
  gmail_client_id text,
  gmail_client_secret_enc text,
  gmail_refresh_token_enc text,
  gmail_sender_email text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.email_delivery_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.email_delivery_settings enable row level security;
-- No policies: only service role / server-side admin client reads or writes this table.
