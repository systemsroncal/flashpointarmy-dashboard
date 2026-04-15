-- System-managed email OTP for registration (SMTP sender in app backend).

create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  purpose text not null default 'register',
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_otp_email_purpose_created
  on public.email_otp_codes (lower(email), purpose, created_at desc);

create index if not exists idx_email_otp_active
  on public.email_otp_codes (lower(email), purpose, expires_at)
  where consumed_at is null;

alter table public.email_otp_codes enable row level security;

drop policy if exists "email_otp_codes no direct access" on public.email_otp_codes;
create policy "email_otp_codes no direct access" on public.email_otp_codes
  for all to authenticated using (false) with check (false);
