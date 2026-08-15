-- Reliably mirror Mobilize social activity into Community in Action.
-- Database triggers cover every writer (API, admin tools, imports) and source keys prevent duplicates.

alter table public.community_activity
  add column if not exists source_type text,
  add column if not exists source_id text;

create unique index if not exists uq_community_activity_source
  on public.community_activity (source_type, source_id)
  where source_type is not null and source_id is not null;

-- During a rolling deploy, older API code may still insert the same source-less
-- row after the DB trigger. Suppress only exact duplicates inside a short window.
create or replace function public.community_feed_suppress_recent_duplicate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source_type is null
     and new.actor_user_id is not null
     and exists (
       select 1
       from public.community_activity a
       where a.actor_user_id = new.actor_user_id
         and a.feed_category = new.feed_category
         and a.title = new.title
         and a.created_at >= now() - interval '10 seconds'
     ) then
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists community_feed_suppress_recent_duplicate on public.community_activity;
create trigger community_feed_suppress_recent_duplicate
before insert on public.community_activity
for each row execute function public.community_feed_suppress_recent_duplicate();

create or replace function public.community_feed_actor_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(
      concat_ws(
        ' ',
        nullif(initcap(trim(u.first_name)), ''),
        case
          when nullif(trim(u.last_name), '') is not null
            then upper(left(trim(u.last_name), 1)) || '.'
          else null
        end
      ),
      ''
    ),
    nullif(initcap(trim(u.display_name)), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'A member'
  )
  from public.dashboard_users u
  where u.id = p_user_id;
$$;

create or replace function public.community_feed_group_name(p_group_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when trim(g.name) ~* '\sGroup$' then trim(g.name)
    else trim(g.name) || ' Group'
  end
  from public.mobilize_groups g
  where g.id = p_group_id;
$$;

create or replace function public.community_feed_group_state(p_group_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when trim(coalesce(g.region_code, '')) ~ '^[A-Za-z]{2}$'
      then upper(trim(g.region_code))
    when trim(coalesce(parent.region_code, '')) ~ '^[A-Za-z]{2}$'
      then upper(trim(parent.region_code))
    else null
  end
  from public.mobilize_groups g
  left join public.mobilize_groups parent on parent.id = g.parent_group_id
  where g.id = p_group_id;
$$;

create or replace function public.community_feed_insert(
  p_source_type text,
  p_source_id text,
  p_category text,
  p_title text,
  p_subtitle text,
  p_state_code text,
  p_icon_key text,
  p_actor_user_id uuid,
  p_created_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_activity (
    feed_category,
    title,
    subtitle,
    state_code,
    icon_key,
    actor_user_id,
    created_at,
    source_type,
    source_id
  )
  values (
    p_category,
    p_title,
    p_subtitle,
    p_state_code,
    p_icon_key,
    p_actor_user_id,
    coalesce(p_created_at, now()),
    p_source_type,
    p_source_id
  )
  on conflict (source_type, source_id)
    where source_type is not null and source_id is not null
  do nothing;
end;
$$;

create or replace function public.community_feed_on_group_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.membership_status = 'approved'
     and (tg_op = 'INSERT' or old.membership_status is distinct from 'approved') then
    perform public.community_feed_insert(
      'mobilize_group_member',
      new.id::text,
      'group_join',
      public.community_feed_actor_name(new.user_id) || ' joined ' ||
        public.community_feed_group_name(new.group_id),
      'Community Activity',
      public.community_feed_group_state(new.group_id),
      'groups',
      new.user_id,
      new.created_at
    );
  end if;
  return new;
end;
$$;

drop trigger if exists community_feed_group_member on public.mobilize_group_members;
create trigger community_feed_group_member
after insert or update of membership_status on public.mobilize_group_members
for each row execute function public.community_feed_on_group_member();

create or replace function public.community_feed_on_group_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_title text;
begin
  post_title := case
    when cardinality(coalesce(new.image_urls, '{}'::text[])) > 0
      then public.community_feed_actor_name(new.author_id) || ' uploaded a photo in ' ||
        public.community_feed_group_name(new.group_id)
    else public.community_feed_actor_name(new.author_id) || ' posted in ' ||
      public.community_feed_group_name(new.group_id)
  end;

  perform public.community_feed_insert(
    'mobilize_group_message',
    new.id::text,
    'group_post',
    post_title,
    'Community Activity',
    public.community_feed_group_state(new.group_id),
    'bolt',
    new.author_id,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists community_feed_group_post on public.mobilize_group_messages;
create trigger community_feed_group_post
after insert on public.mobilize_group_messages
for each row execute function public.community_feed_on_group_post();

create or replace function public.community_feed_on_group_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_title text;
begin
  select m.group_id into v_group_id
  from public.mobilize_group_messages m
  where m.id = new.message_id;

  v_title := case
    when new.parent_id is not null
      then public.community_feed_actor_name(new.author_id) || ' replied to a post'
    else public.community_feed_actor_name(new.author_id) || ' commented in ' ||
      public.community_feed_group_name(v_group_id)
  end;

  perform public.community_feed_insert(
    'mobilize_message_comment',
    new.id::text,
    case when new.parent_id is not null then 'group_reply' else 'group_comment' end,
    v_title,
    'Community Activity',
    public.community_feed_group_state(v_group_id),
    'bolt',
    new.author_id,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists community_feed_group_comment on public.mobilize_message_comments;
create trigger community_feed_group_comment
after insert on public.mobilize_message_comments
for each row execute function public.community_feed_on_group_comment();

create or replace function public.community_feed_on_group_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select m.group_id into v_group_id
  from public.mobilize_group_messages m
  where m.id = new.message_id;

  perform public.community_feed_insert(
    'mobilize_message_reaction',
    new.message_id::text || ':' || new.user_id::text,
    'group_like',
    public.community_feed_actor_name(new.user_id) || ' liked a post',
    'Community Activity',
    public.community_feed_group_state(v_group_id),
    'bolt',
    new.user_id,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists community_feed_group_reaction on public.mobilize_message_reactions;
create trigger community_feed_group_reaction
after insert on public.mobilize_message_reactions
for each row execute function public.community_feed_on_group_reaction();

create or replace function public.community_feed_on_profile_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_endorsers integer;
begin
  select p.author_id into v_owner_id
  from public.mobilize_profile_posts p
  where p.id = new.post_id;

  perform public.community_feed_insert(
    'mobilize_profile_post_reaction',
    new.post_id::text || ':' || new.user_id::text,
    'group_like',
    public.community_feed_actor_name(new.user_id) || ' liked a post',
    'Community Activity',
    null,
    'bolt',
    new.user_id,
    new.created_at
  );

  select count(distinct r.user_id) into v_endorsers
  from public.mobilize_profile_post_reactions r
  join public.mobilize_profile_posts p on p.id = r.post_id
  where p.author_id = v_owner_id
    and r.user_id <> v_owner_id;

  if v_endorsers >= 5 then
    perform public.community_feed_insert(
      'mobilize_profile_endorsements',
      v_owner_id::text || ':5',
      'profile_endorsements',
      public.community_feed_actor_name(v_owner_id) || ' received five profile endorsements.',
      'Social Connections',
      null,
      'star',
      v_owner_id,
      new.created_at
    );
  end if;
  return new;
end;
$$;

drop trigger if exists community_feed_profile_reaction on public.mobilize_profile_post_reactions;
create trigger community_feed_profile_reaction
after insert on public.mobilize_profile_post_reactions
for each row execute function public.community_feed_on_profile_reaction();

create or replace function public.community_feed_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.community_feed_insert(
    'mobilize_user_follow',
    new.follower_id::text || ':' || new.following_id::text,
    'social_follow',
    public.community_feed_actor_name(new.follower_id) || ' started following ' ||
      public.community_feed_actor_name(new.following_id),
    'Social Connections',
    null,
    'person',
    new.follower_id,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists community_feed_follow on public.mobilize_user_follows;
create trigger community_feed_follow
after insert on public.mobilize_user_follows
for each row execute function public.community_feed_on_follow();

create or replace function public.community_feed_on_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.bio is distinct from new.bio
     or old.profile_visibility is distinct from new.profile_visibility
     or old.avatar_url is distinct from new.avatar_url
     or old.cover_url is distinct from new.cover_url then
    perform public.community_feed_insert(
      'profile_update',
      new.id::text || ':' || extract(epoch from clock_timestamp())::bigint::text,
      'profile_update',
      public.community_feed_actor_name(new.id) || ' updated profile information',
      'Social Connections',
      null,
      'person',
      new.id,
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists community_feed_profile_update on public.profiles;
create trigger community_feed_profile_update
after update of bio, profile_visibility, avatar_url, cover_url on public.profiles
for each row execute function public.community_feed_on_profile_update();

-- Backfill recent activity so Community in Action is populated immediately.
select public.community_feed_insert(
  'mobilize_group_member',
  m.id::text,
  'group_join',
  public.community_feed_actor_name(m.user_id) || ' joined ' ||
    public.community_feed_group_name(m.group_id),
  'Community Activity',
  public.community_feed_group_state(m.group_id),
  'groups',
  m.user_id,
  m.created_at
)
from public.mobilize_group_members m
where m.membership_status = 'approved'
  and m.created_at >= now() - interval '30 days';

select public.community_feed_insert(
  'mobilize_group_message',
  m.id::text,
  'group_post',
  case
    when cardinality(coalesce(m.image_urls, '{}'::text[])) > 0
      then public.community_feed_actor_name(m.author_id) || ' uploaded a photo in ' ||
        public.community_feed_group_name(m.group_id)
    else public.community_feed_actor_name(m.author_id) || ' posted in ' ||
      public.community_feed_group_name(m.group_id)
  end,
  'Community Activity',
  public.community_feed_group_state(m.group_id),
  'bolt',
  m.author_id,
  m.created_at
)
from public.mobilize_group_messages m
where m.created_at >= now() - interval '30 days';

select public.community_feed_insert(
  'mobilize_message_comment',
  c.id::text,
  case when c.parent_id is not null then 'group_reply' else 'group_comment' end,
  case
    when c.parent_id is not null
      then public.community_feed_actor_name(c.author_id) || ' replied to a post'
    else public.community_feed_actor_name(c.author_id) || ' commented in ' ||
      public.community_feed_group_name(m.group_id)
  end,
  'Community Activity',
  public.community_feed_group_state(m.group_id),
  'bolt',
  c.author_id,
  c.created_at
)
from public.mobilize_message_comments c
join public.mobilize_group_messages m on m.id = c.message_id
where c.created_at >= now() - interval '30 days';

select public.community_feed_insert(
  'mobilize_message_reaction',
  r.message_id::text || ':' || r.user_id::text,
  'group_like',
  public.community_feed_actor_name(r.user_id) || ' liked a post',
  'Community Activity',
  public.community_feed_group_state(m.group_id),
  'bolt',
  r.user_id,
  r.created_at
)
from public.mobilize_message_reactions r
join public.mobilize_group_messages m on m.id = r.message_id
where r.created_at >= now() - interval '30 days';

select public.community_feed_insert(
  'mobilize_profile_post_reaction',
  r.post_id::text || ':' || r.user_id::text,
  'group_like',
  public.community_feed_actor_name(r.user_id) || ' liked a post',
  'Community Activity',
  null,
  'bolt',
  r.user_id,
  r.created_at
)
from public.mobilize_profile_post_reactions r
where r.created_at >= now() - interval '30 days';

select public.community_feed_insert(
  'mobilize_user_follow',
  f.follower_id::text || ':' || f.following_id::text,
  'social_follow',
  public.community_feed_actor_name(f.follower_id) || ' started following ' ||
    public.community_feed_actor_name(f.following_id),
  'Social Connections',
  null,
  'person',
  f.follower_id,
  f.created_at
)
from public.mobilize_user_follows f
where f.created_at >= now() - interval '30 days';

insert into public.community_activity (
  feed_category,
  title,
  subtitle,
  icon_key,
  actor_user_id,
  created_at,
  source_type,
  source_id
)
select
  'profile_endorsements',
  public.community_feed_actor_name(p.author_id) || ' received five profile endorsements.',
  'Social Connections',
  'star',
  p.author_id,
  max(r.created_at),
  'mobilize_profile_endorsements',
  p.author_id::text || ':5'
from public.mobilize_profile_posts p
join public.mobilize_profile_post_reactions r on r.post_id = p.id
where r.user_id <> p.author_id
group by p.author_id
having count(distinct r.user_id) >= 5
on conflict (source_type, source_id)
  where source_type is not null and source_id is not null
do nothing;
