-- Mobilize subsystem: isolated from public.gatherings / command center events.
-- Naming prefix mobilize_* avoids collisions with existing "events" naming in the app.
--
-- Scalability notes (embedded in this migration):
-- 1) Coordinates: double precision lat/lng (WGS84) keep the schema portable without requiring
--    PostGIS on every deployment. For millions of rows, consider PostGIS geography(Point,4326)
--    + GiST index and ST_DWithin for radius queries, or partition by region_code.
-- 2) Discovery: the app should pre-filter by a bounding box (derived from radius) then apply
--    Haversine in SQL or application code to sort by distance — btree on (lat,lng) supports
--    coarse pruning when combined with visibility predicates.
-- 3) Hot paths: partial indexes on visibility = 'public' and is_public = true keep map and
--    "Upcoming Activities" feeds smaller and faster.
-- 4) Walls: index (group_id, created_at desc) supports pagination (keyset / cursor) for messages.

-- ---------------------------------------------------------------------------
-- mobilize_groups
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Free-form category for filtering (reading, prayer, march, support, etc.)
  group_type text not null,
  description text,
  address text,
  latitude double precision,
  longitude double precision,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  -- Who may create mobilize_events for this group (separate from gatherings module).
  event_create_policy text not null default 'any_member' check (event_create_policy in ('any_member', 'leader_only')),
  created_by uuid not null references public.dashboard_users (id) on delete restrict,
  region_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobilize_groups_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint mobilize_groups_lat_range check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint mobilize_groups_lng_range check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create index if not exists idx_mobilize_groups_created_by on public.mobilize_groups (created_by);
create index if not exists idx_mobilize_groups_type on public.mobilize_groups (group_type);
create index if not exists idx_mobilize_groups_public_geo on public.mobilize_groups (latitude, longitude)
  where visibility = 'public' and latitude is not null and longitude is not null;
create index if not exists idx_mobilize_groups_region on public.mobilize_groups (region_code)
  where region_code is not null;

-- ---------------------------------------------------------------------------
-- mobilize_group_members (roles + join workflow)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('leader', 'member')),
  membership_status text not null default 'pending' check (membership_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists idx_mobilize_group_members_user on public.mobilize_group_members (user_id);
create index if not exists idx_mobilize_group_members_group_status on public.mobilize_group_members (group_id, membership_status);
create index if not exists idx_mobilize_group_members_pending_leaders on public.mobilize_group_members (group_id)
  where membership_status = 'pending';

-- ---------------------------------------------------------------------------
-- mobilize_events (NOT gatherings — separate lifecycle and APIs)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  title text not null,
  description text,
  date_time timestamptz not null,
  address text,
  latitude double precision,
  longitude double precision,
  event_type text not null,
  is_public boolean not null default false,
  created_by uuid not null references public.dashboard_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mobilize_events_lat_lng_pair check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint mobilize_events_lat_range check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint mobilize_events_lng_range check (longitude is null or (longitude >= -180 and longitude <= 180))
);

create index if not exists idx_mobilize_events_group_time on public.mobilize_events (group_id, date_time);
create index if not exists idx_mobilize_events_public_time on public.mobilize_events (date_time)
  where is_public = true;
create index if not exists idx_mobilize_events_public_geo on public.mobilize_events (latitude, longitude)
  where is_public = true and latitude is not null and longitude is not null;

-- ---------------------------------------------------------------------------
-- mobilize_event_rsvp
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_event_rsvp (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.mobilize_events (id) on delete cascade,
  user_id uuid not null references public.dashboard_users (id) on delete cascade,
  rsvp_status text not null default 'yes' check (rsvp_status in ('yes', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists idx_mobilize_event_rsvp_event on public.mobilize_event_rsvp (event_id);
create index if not exists idx_mobilize_event_rsvp_user on public.mobilize_event_rsvp (user_id);

-- ---------------------------------------------------------------------------
-- mobilize_group_messages (group wall)
-- ---------------------------------------------------------------------------
create table if not exists public.mobilize_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mobilize_groups (id) on delete cascade,
  author_id uuid not null references public.dashboard_users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobilize_group_messages_group_time on public.mobilize_group_messages (group_id, created_at desc);

-- Creator becomes an approved leader row (bypasses RLS on members via SECURITY DEFINER).
create or replace function public.mobilize_groups_after_insert_add_leader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mobilize_group_members (group_id, user_id, member_role, membership_status)
  values (new.id, new.created_by, 'leader', 'approved');
  return new;
end;
$$;

drop trigger if exists trg_mobilize_groups_add_leader on public.mobilize_groups;
create trigger trg_mobilize_groups_add_leader
  after insert on public.mobilize_groups
  for each row execute function public.mobilize_groups_after_insert_add_leader();

-- ---------------------------------------------------------------------------
-- Row level security (baseline; tighten when all access goes through user JWT + RLS)
-- ---------------------------------------------------------------------------
alter table public.mobilize_groups enable row level security;
alter table public.mobilize_group_members enable row level security;
alter table public.mobilize_events enable row level security;
alter table public.mobilize_event_rsvp enable row level security;
alter table public.mobilize_group_messages enable row level security;

-- Groups: read if public, creator, or approved member. Insert only as self creator.
drop policy if exists "mobilize_groups select scoped" on public.mobilize_groups;
create policy "mobilize_groups select scoped" on public.mobilize_groups
  for select to authenticated using (
    visibility = 'public'
    or created_by = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_groups.id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

drop policy if exists "mobilize_groups insert self" on public.mobilize_groups;
create policy "mobilize_groups insert self" on public.mobilize_groups
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "mobilize_groups update scoped" on public.mobilize_groups;
create policy "mobilize_groups update scoped" on public.mobilize_groups
  for update to authenticated using (
    created_by = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_groups.id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_groups.id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  );

-- Members: see own rows and rows for groups you lead (approve flow).
drop policy if exists "mobilize_group_members select scoped" on public.mobilize_group_members;
create policy "mobilize_group_members select scoped" on public.mobilize_group_members
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_members.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
    or exists (
      select 1 from public.mobilize_groups g
      where g.id = mobilize_group_members.group_id
        and g.visibility = 'public'
        and mobilize_group_members.membership_status = 'approved'
    )
  );

drop policy if exists "mobilize_group_members insert self" on public.mobilize_group_members;
create policy "mobilize_group_members insert self" on public.mobilize_group_members
  for insert to authenticated with check (
    user_id = auth.uid()
    and membership_status = 'pending'
    and member_role = 'member'
    and exists (
      select 1 from public.mobilize_groups g
      where g.id = mobilize_group_members.group_id
        and g.visibility = 'public'
    )
  );

drop policy if exists "mobilize_group_members update leaders" on public.mobilize_group_members;
create policy "mobilize_group_members update leaders" on public.mobilize_group_members
  for update to authenticated using (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_members.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  );

-- Helper for event create rules (must exist before mobilize_events policies reference it).
create or replace function public.mobilize_groups_event_policy_allows(p_group_id uuid, p_member_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when g.event_create_policy = 'leader_only' then p_member_role = 'leader'
    else true
  end
  from public.mobilize_groups g
  where g.id = p_group_id
  limit 1;
$$;

grant execute on function public.mobilize_groups_event_policy_allows(uuid, text) to authenticated;

-- Events: members of hosting group, or public event for any authenticated user.
drop policy if exists "mobilize_events select scoped" on public.mobilize_events;
create policy "mobilize_events select scoped" on public.mobilize_events
  for select to authenticated using (
    is_public = true
    or exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_events.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
    or created_by = auth.uid()
  );

drop policy if exists "mobilize_events mutate members" on public.mobilize_events;

create policy "mobilize_events mutate members" on public.mobilize_events
  for insert to authenticated with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_events.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and public.mobilize_groups_event_policy_allows(m.group_id, m.member_role)
    )
  );

drop policy if exists "mobilize_events update members" on public.mobilize_events;
create policy "mobilize_events update members" on public.mobilize_events
  for update to authenticated using (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_events.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and public.mobilize_groups_event_policy_allows(m.group_id, m.member_role)
    )
  )
  with check (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_events.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and public.mobilize_groups_event_policy_allows(m.group_id, m.member_role)
    )
  );

drop policy if exists "mobilize_events delete leaders" on public.mobilize_events;
create policy "mobilize_events delete leaders" on public.mobilize_events
  for delete to authenticated using (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_events.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
        and m.member_role = 'leader'
    )
  );

-- RSVP: own rows + read RSVPs for events you can see
drop policy if exists "mobilize_event_rsvp select scoped" on public.mobilize_event_rsvp;
create policy "mobilize_event_rsvp select scoped" on public.mobilize_event_rsvp
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.mobilize_events e
      where e.id = mobilize_event_rsvp.event_id
        and (
          e.is_public = true
          or exists (
            select 1 from public.mobilize_group_members m
            where m.group_id = e.group_id
              and m.user_id = auth.uid()
              and m.membership_status = 'approved'
              and m.member_role = 'leader'
          )
        )
    )
  );

drop policy if exists "mobilize_event_rsvp upsert self" on public.mobilize_event_rsvp;
create policy "mobilize_event_rsvp upsert self" on public.mobilize_event_rsvp
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.mobilize_events e
      join public.mobilize_group_members m on m.group_id = e.group_id and m.user_id = auth.uid()
        and m.membership_status = 'approved'
      where e.id = mobilize_event_rsvp.event_id
    )
  );

drop policy if exists "mobilize_event_rsvp update self" on public.mobilize_event_rsvp;
create policy "mobilize_event_rsvp update self" on public.mobilize_event_rsvp
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "mobilize_event_rsvp delete self" on public.mobilize_event_rsvp;
create policy "mobilize_event_rsvp delete self" on public.mobilize_event_rsvp
  for delete to authenticated using (user_id = auth.uid());

-- Messages: approved members of the group
drop policy if exists "mobilize_group_messages select members" on public.mobilize_group_messages;
create policy "mobilize_group_messages select members" on public.mobilize_group_messages
  for select to authenticated using (
    exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_messages.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

drop policy if exists "mobilize_group_messages insert members" on public.mobilize_group_messages;
create policy "mobilize_group_messages insert members" on public.mobilize_group_messages
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.mobilize_group_members m
      where m.group_id = mobilize_group_messages.group_id
        and m.user_id = auth.uid()
        and m.membership_status = 'approved'
    )
  );

-- Trigger: keep mobilize_groups.updated_at fresh
create or replace function public.touch_mobilize_groups_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mobilize_groups_touch on public.mobilize_groups;
create trigger trg_mobilize_groups_touch
  before update on public.mobilize_groups
  for each row execute function public.touch_mobilize_groups_updated_at();

create or replace function public.touch_mobilize_events_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mobilize_events_touch on public.mobilize_events;
create trigger trg_mobilize_events_touch
  before update on public.mobilize_events
  for each row execute function public.touch_mobilize_events_updated_at();
