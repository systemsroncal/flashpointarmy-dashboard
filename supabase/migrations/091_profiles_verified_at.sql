-- Account verification badge (super_admin managed). Distinct from local_leader_verified.
alter table public.profiles
  add column if not exists verified_at timestamptz null;

comment on column public.profiles.verified_at is
  'When set, the user account is verified by a super_admin. Distinct from local_leader_verified (Mobilize group creation).';

create index if not exists profiles_verified_at_idx
  on public.profiles (verified_at)
  where verified_at is not null;
