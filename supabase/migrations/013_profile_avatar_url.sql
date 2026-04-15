-- Optional public avatar URL for profile UI (e.g. HTTPS image link).
alter table public.profiles
  add column if not exists avatar_url text;
