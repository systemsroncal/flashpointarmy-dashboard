-- Mobilize subsystem: groups, memberships, events (isolated from gatherings/events),
-- RSVPs, and group walls. Access is intended via Next.js API routes using the service role.
--
-- Scalability notes:
-- * latitude/longitude as double precision keeps the stack free of PostGIS while staying
--   compatible with adding a generated geography column later: `ALTER TABLE ... ADD COLUMN
--   geog geography(POINT,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)::geography) STORED;`
--   plus a GiST index on `geog` for radius queries at scale.
-- * Partial indexes target hot paths (public discovery, upcoming public events) to keep
--   index size smaller as rows grow.
-- * `starts_at` / `created_at` timestamptz store UTC; clients send ISO-8601 with offsets.
-- * For multi-region partitioning at very large scale, consider range partitioning on
--   `date_trunc('month', created_at)` for `mobilize_groups` / `mobilize_events` — not applied here.

-- ---------------------------------------------------------------------------
-- mobilize_groups
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_type text not null,
  description text,
  address_line text,
  latitude double precision,
  longitude double precision,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  geocoded_at timestamptz,
  only_leaders_can_create_events boolean not null default false,
  constraint mobilize_groups_name_len check (char_length(trim(name)) >= 2),
  constraint mobilize_groups_lat_range check (latitude is null or (latitude between -90 and 90)),
  constraint mobilize_groups_lng_range check (longitude is null or (longitude between -180 and 180)),
  constraint mobilize_groups_coords_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  )
);

create index if not exists idx_mobilize_groups_created_by on public.mobilize_groups (created_by);
create index if not exists idx_mobilize_groups_created_at on public.mobilize_groups (created_at desc);
create index if not exists idx_mobilize_groups_public_map on public.mobilize_groups (group_type)
  where visibility = 'public' and latitude is not null and longitude is not null;

comment on table public.mobilize_groups is 'Mobilization groups; not linked to chapters/gatherings.';

-- ---------------------------------------------------------------------------
-- mobilize_group_members
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_role text not null check (member_role in ('leader', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  unique (group_id, user_id)
);

create index if not exists idx_mobilize_group_members_group on public.mobilize_group_members (group_id);
create index if not exists idx_mobilize_group_members_user on public.mobilize_group_members (user_id);
create index if not exists idx_mobilize_group_members_pending on public.mobilize_group_members (group_id)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- mobilize_events (Mobilize-only; do not join to gatherings)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  address_line text,
  latitude double precision,
  longitude double precision,
  event_type text not null,
  is_public boolean not null default false,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobilize_events_lat_range check (latitude is null or (latitude between -90 and 90)),
  constraint mobilize_events_lng_range check (longitude is null or (longitude between -180 and 180)),
  constraint mobilize_events_coords_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint mobilize_events_title_len check (char_length(trim(title)) >= 2)
);

create index if not exists idx_mobilize_events_group_time on public.mobilize_events (group_id, starts_at);
create index if not exists idx_mobilize_events_public_upcoming on public.mobilize_events (starts_at)
  where is_public = true;
create index if not exists idx_mobilize_events_starts_at on public.mobilize_events (starts_at);

-- ---------------------------------------------------------------------------
-- mobilize_event_rsvp
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_event_rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.mobilize_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists idx_mobilize_event_rsvp_event on public.mobilize_event_rsvp (event_id);
create index if not exists idx_mobilize_event_rsvp_user on public.mobilize_event_rsvp (user_id);

-- ---------------------------------------------------------------------------
-- mobilize_group_messages (wall)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint mobilize_group_messages_body_len check (char_length(trim(body)) >= 1)
);

create index if not exists idx_mobilize_group_messages_group_time on public.mobilize_group_messages (group_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: enabled with no policies for authenticated/anon — API uses service role.
-- ---------------------------------------------------------------------------
alter table public.mobilize_groups enable row level security;
alter table public.mobilize_group_members enable row level security;
alter table public.mobilize_events enable row level security;
alter table public.mobilize_event_rsvp enable row level security;
alter table public.mobilize_group_messages enable row level security;

-- Mobilize content creation (groups, wall posts, RSVPs) should be available to authenticated
-- dashboard users who can open the module. Existing `movilization` rows granted members read-only;
-- widen create/update for member/local_leader so APIs can authorize collaborative use while
-- still enforcing row-level rules in application code.
update public.role_permissions rp
set can_create = true,
    can_update = true
from public.roles r
join public.modules m on m.slug = 'movilization'
where rp.role_id = r.id
  and rp.module_id = m.id
  and r.name in ('member', 'local_leader');
