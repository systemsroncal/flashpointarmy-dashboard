-- Command Center: chapters, gatherings, community activity, user prefs.

-- --- Chapters ---
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_line text,
  city text,
  state text not null,
  zip_code text,
  status text not null default 'created'
    check (status in ('approved', 'pending_approval', 'created')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_chapters_state on public.chapters (upper(state));
create index if not exists idx_chapters_status on public.chapters (status);

create table if not exists public.chapter_leaders (
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (chapter_id, user_id)
);

alter table public.profiles
  add column if not exists primary_chapter_id uuid references public.chapters (id) on delete set null;

alter table public.profiles
  add column if not exists overview_scope text default 'state'
    check (overview_scope is null or overview_scope in ('national', 'state'));

-- --- Community activity feed (last ~5 min for “Happening Now” + “Community in Action”) ---
create table if not exists public.community_activity (
  id uuid primary key default gen_random_uuid(),
  feed_category text not null,
  title text not null,
  subtitle text,
  state_code text,
  icon_key text,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_activity_created on public.community_activity (created_at desc);

-- --- Event categories + gatherings ---
create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gatherings (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters (id) on delete set null,
  use_chapter_address boolean not null default false,
  location_manual text,
  title text not null,
  subtitle text,
  starts_at timestamptz not null,
  category_id uuid references public.event_categories (id) on delete set null,
  description_html text,
  featured_image_url text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gatherings_starts on public.gatherings (starts_at);
create index if not exists idx_gatherings_chapter on public.gatherings (chapter_id);

-- --- Gathering comments (single event page) ---
create table if not exists public.gathering_comments (
  id uuid primary key default gen_random_uuid(),
  gathering_id uuid not null references public.gatherings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gathering_comments_g on public.gathering_comments (gathering_id, created_at);

-- --- Dependency summary for chapter delete (UI warnings) ---
create or replace function public.chapter_dependency_counts(p_chapter_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'gatherings', coalesce((select count(*)::int from public.gatherings g where g.chapter_id = p_chapter_id), 0),
    'chapter_leaders', coalesce((select count(*)::int from public.chapter_leaders cl where cl.chapter_id = p_chapter_id), 0),
    'profiles_primary_chapter', coalesce((select count(*)::int from public.profiles p where p.primary_chapter_id = p_chapter_id), 0)
  );
$$;

-- --- Modules + permissions (idempotent seeds) ---
insert into public.modules (slug, name, sort_order) values
  ('national_overview', 'National overview', 5),
  ('chapters', 'Chapters', 15),
  ('community', 'Community', 25),
  ('gatherings', 'Gatherings', 35),
  ('leaders', 'Leaders', 45),
  ('training', 'Training', 55),
  ('communications', 'Communications', 65),
  ('growth', 'Growth', 75)
on conflict (slug) do nothing;

-- super_admin + admin: full CRUD on new modules
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, true, true, true, true
from public.roles r
cross join public.modules m
where r.name in ('super_admin', 'admin')
  and m.slug in (
    'national_overview', 'chapters', 'community', 'gatherings', 'leaders',
    'training', 'communications', 'growth'
  )
on conflict (role_id, module_id) do nothing;

-- local_leader: read national overview, manage chapters/gatherings in scope (RLS can tighten later)
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id,
  case when m.slug in ('chapters', 'gatherings', 'community') then true else false end,
  true,
  case when m.slug in ('chapters', 'gatherings') then true else false end,
  case when m.slug = 'chapters' then true else false end
from public.roles r
cross join public.modules m
where r.name = 'local_leader'
  and m.slug in (
    'national_overview', 'chapters', 'community', 'gatherings', 'leaders',
    'training', 'communications', 'growth'
  )
on conflict (role_id, module_id) do nothing;

-- member: read-heavy
insert into public.role_permissions (role_id, module_id, can_create, can_read, can_update, can_delete)
select r.id, m.id, false, true, false, false
from public.roles r
cross join public.modules m
where r.name = 'member'
  and m.slug in (
    'national_overview', 'chapters', 'community', 'gatherings', 'leaders',
    'training', 'communications', 'growth'
  )
on conflict (role_id, module_id) do nothing;

-- Sample categories + demo activity (dev-friendly)
insert into public.event_categories (name, slug, sort_order) values
  ('Upcoming gatherings', 'upcoming_gatherings', 10),
  ('Community', 'community', 20),
  ('Leadership', 'leadership', 30)
on conflict (slug) do nothing;

insert into public.community_activity (feed_category, title, subtitle, state_code, icon_key)
select v.feed_category, v.title, v.subtitle, v.state_code, v.icon_key
from (values
  ('upcoming_gatherings', 'Prayer Gathering This Saturday', 'Upcoming gatherings', 'TX', 'calendar'),
  ('hosted_events', '120 Members Gathered This Weekend', 'Recently hosted events', 'GA', 'clock'),
  ('growth', '1,000 New Members This Month', 'Growth milestones', 'TX', 'trend')
) as v(feed_category, title, subtitle, state_code, icon_key)
where not exists (select 1 from public.community_activity limit 1);

-- RLS
alter table public.chapters enable row level security;
alter table public.chapter_leaders enable row level security;
alter table public.community_activity enable row level security;
alter table public.event_categories enable row level security;
alter table public.gatherings enable row level security;
alter table public.gathering_comments enable row level security;

drop policy if exists "chapters authenticated all" on public.chapters;
create policy "chapters authenticated all" on public.chapters
  for all to authenticated using (true) with check (true);

drop policy if exists "chapter_leaders authenticated all" on public.chapter_leaders;
create policy "chapter_leaders authenticated all" on public.chapter_leaders
  for all to authenticated using (true) with check (true);

drop policy if exists "community_activity authenticated all" on public.community_activity;
create policy "community_activity authenticated all" on public.community_activity
  for all to authenticated using (true) with check (true);

drop policy if exists "event_categories authenticated all" on public.event_categories;
create policy "event_categories authenticated all" on public.event_categories
  for all to authenticated using (true) with check (true);

drop policy if exists "gatherings authenticated all" on public.gatherings;
create policy "gatherings authenticated all" on public.gatherings
  for all to authenticated using (true) with check (true);

drop policy if exists "gathering_comments authenticated all" on public.gathering_comments;
create policy "gathering_comments authenticated all" on public.gathering_comments
  for all to authenticated using (true) with check (true);
