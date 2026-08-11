-- Make every existing dashboard user follow a fixed set of target users.
--
-- Targets (by email):
--   gene@fparmy.com
--   whutchins@champ.org
--   ricardo.a@dreamsanimation.com
--
-- Idempotent: uses INSERT ... ON CONFLICT (follower_id, following_id) DO NOTHING,
-- so re-running will not create duplicates and will not error on existing rows.
-- The check constraint (follower_id <> following_id) is respected because the
-- CTE explicitly excludes target users from the follower pool.
--
-- Run from Supabase SQL Editor (service role bypasses RLS) or as a migration.
-- Safe to run multiple times.

with target_users as (
  select id
  from public.dashboard_users
  where lower(email) in (
    lower('gene@fparmy.com'),
    lower('whutchins@champ.org'),
    lower('ricardo.a@dreamsanimation.com')
  )
),
followers as (
  -- Every dashboard user EXCEPT the targets themselves (avoid self-follow).
  select u.id as follower_id
  from public.dashboard_users u
  where u.id not in (select id from target_users)
)
insert into public.mobilize_user_follows (follower_id, following_id)
select f.follower_id, t.id as following_id
from followers f
cross join target_users t
on conflict (follower_id, following_id) do nothing;

-- Optional: verify the result (uncomment to inspect).
-- select
--   t.email        as target_email,
--   count(f.*)     as follower_count
-- from public.mobilize_user_follows f
-- join public.dashboard_users t on t.id = f.following_id
-- where lower(t.email) in (
--   lower('gene@fparmy.com'),
--   lower('whutchins@champ.org'),
--   lower('ricardo.a@dreamsanimation.com')
-- )
-- group by t.email
-- order by t.email;
