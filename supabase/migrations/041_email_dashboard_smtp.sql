-- Optional SMTP stored in DB (encrypted password) + explicit sender email/name.
-- Provider gains `dashboard_smtp` alongside env + Gmail OAuth.

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    where t.relname = 'email_delivery_settings'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%provider%'
  loop
    execute format('alter table public.email_delivery_settings drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.email_delivery_settings
  add constraint email_delivery_settings_provider_chk
  check (provider in ('env_smtp', 'gmail_workspace_oauth', 'dashboard_smtp'));

alter table public.email_delivery_settings
  add column if not exists smtp_host text,
  add column if not exists smtp_port integer,
  add column if not exists smtp_secure boolean default false,
  add column if not exists smtp_auth_user text,
  add column if not exists smtp_auth_pass_enc text,
  add column if not exists smtp_from_email text,
  add column if not exists smtp_from_name text;
