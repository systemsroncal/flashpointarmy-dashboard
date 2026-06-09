-- Full export queries for Supabase SQL Editor.
-- Run each block separately and download the full CSV.
--
-- OVERVIEW cards use:
--   Members       = all user_roles with role `member` (may include leaders too)
--   Local Leaders = all user_roles with role `local_leader`
--
-- COMMUNITY page uses dashboard_community_members (members only, no leaders/admins).

-- ── OVERVIEW: MEMBERS (all with role member) ─────────────────────────────
select
  du.email,
  du.first_name,
  du.last_name,
  du.display_name,
  coalesce(nullif(trim(p.phone), ''), du.phone) as phone,
  coalesce(nullif(trim(p.address_line), ''), du.address_line) as address_line,
  coalesce(nullif(trim(p.city), ''), du.city) as city,
  coalesce(nullif(trim(p.state), ''), du.state) as state,
  coalesce(nullif(trim(p.zip_code), ''), du.zip_code) as zip_code,
  c.name as chapter_name,
  c.city as chapter_city,
  c.state as chapter_state,
  string_agg(distinct r.name, ', ' order by r.name) as roles,
  du.created_at as registered_at,
  du.id as user_id
from public.dashboard_users du
inner join public.user_roles ur on ur.user_id = du.id
inner join public.roles r_member on r_member.id = ur.role_id and r_member.name = 'member'
left join public.user_roles ur_all on ur_all.user_id = du.id
left join public.roles r on r.id = ur_all.role_id
left join public.profiles p on p.id = du.id
left join public.chapters c on c.id = coalesce(p.primary_chapter_id, du.primary_chapter_id)
group by
  du.id, du.email, du.first_name, du.last_name, du.display_name,
  du.phone, du.address_line, du.city, du.state, du.zip_code, du.created_at,
  p.phone, p.address_line, p.city, p.state, p.zip_code,
  p.primary_chapter_id, du.primary_chapter_id,
  c.name, c.city, c.state
order by du.email;

-- ── COMMUNITY PAGE: members only (excludes leaders/admins) ───────────────
-- select
--   du.email,
--   du.first_name,
--   du.last_name,
--   ...
-- from public.dashboard_community_members du
-- ...

-- ── LOCAL LEADERS ──────────────────────────────────────────────────────────
select
  du.email,
  du.first_name,
  du.last_name,
  du.display_name,
  coalesce(nullif(trim(p.phone), ''), du.phone) as phone,
  coalesce(nullif(trim(p.address_line), ''), du.address_line) as address_line,
  coalesce(nullif(trim(p.city), ''), du.city) as city,
  coalesce(nullif(trim(p.state), ''), du.state) as state,
  coalesce(nullif(trim(p.zip_code), ''), du.zip_code) as zip_code,
  c.name as chapter_name,
  c.city as chapter_city,
  c.state as chapter_state,
  string_agg(distinct r.name, ', ' order by r.name) as roles,
  du.created_at as registered_at,
  du.id as user_id
from public.dashboard_users du
inner join public.user_roles ur on ur.user_id = du.id
inner join public.roles r on r.id = ur.role_id
left join public.profiles p on p.id = du.id
left join public.chapters c on c.id = coalesce(p.primary_chapter_id, du.primary_chapter_id)
where exists (
  select 1
  from public.user_roles ur2
  inner join public.roles r2 on r2.id = ur2.role_id
  where ur2.user_id = du.id
    and r2.name = 'local_leader'
)
group by
  du.id, du.email, du.first_name, du.last_name, du.display_name,
  du.phone, du.address_line, du.city, du.state, du.zip_code, du.created_at,
  p.phone, p.address_line, p.city, p.state, p.zip_code,
  p.primary_chapter_id, du.primary_chapter_id,
  c.name, c.city, c.state
order by du.email;
