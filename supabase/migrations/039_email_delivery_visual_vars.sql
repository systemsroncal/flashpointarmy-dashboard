-- Visual email settings: public app URL + encryption passphrase (server-only via service role).
alter table public.email_delivery_settings
  add column if not exists app_base_url text,
  add column if not exists credentials_encryption_passphrase text;
