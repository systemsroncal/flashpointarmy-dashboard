-- Verified badge for local leaders (staff-managed).
alter table public.profiles
  add column if not exists local_leader_verified boolean not null default false;

comment on column public.profiles.local_leader_verified is
  'When true, this local leader is verified and may create Mobilize groups if settings allow Verified Local Leaders.';

-- Group creator roles: only local_leader | verified_local_leader (admins always can).
-- Migrate legacy admin/member roles out of the array.
update public.mobilize_policy_settings
set group_creator_roles = coalesce(
  (
    select array_agg(distinct x)
    from unnest(group_creator_roles) as x
    where x in ('local_leader', 'verified_local_leader')
  ),
  '{local_leader}'::text[]
)
where id = 1;

-- If empty after filter, default to local_leader (previous default allow).
update public.mobilize_policy_settings
set group_creator_roles = '{local_leader}'::text[]
where id = 1
  and (group_creator_roles is null or cardinality(group_creator_roles) = 0);

alter table public.mobilize_policy_settings
  alter column group_creator_roles set default '{local_leader}';
