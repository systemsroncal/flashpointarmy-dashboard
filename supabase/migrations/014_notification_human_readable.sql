-- Human-readable notification bodies for automatic audit events (English).

create or replace function public.notify_users_on_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ntitle text;
  nbody text;
  p jsonb;
  lid uuid;
  cid uuid;
  fn text;
  ln text;
  short_name text;
  chname text;
  chap_id uuid;
  gtitle text;
  ch_city text;
  ch_state text;
  ch_name text;
  reg_fn text;
  reg_ln text;
  loc_name text;
  loc_region text;
begin
  p := coalesce(new.payload, '{}'::jsonb);

  ntitle := nullif(trim(p->>'title'), '');
  if ntitle is null then
    ntitle := case new.action
      when 'chapter_created' then 'New chapter'
      when 'user_registered' then 'New member registered'
      when 'leader_assigned_to_chapter' then 'Local leader assigned'
      when 'gathering_created' then 'Gathering scheduled'
      when 'location.created' then 'Location created'
      when 'location.updated' then 'Location updated'
      when 'location.deleted' then 'Location deleted'
      when 'local_leader_role_granted' then 'Local leader role granted'
      when 'chapter_approved' then 'Chapter approved'
      else initcap(replace(replace(new.action, '_', ' '), '.', ' · '))
    end;
  end if;

  nbody := nullif(
    trim(coalesce(p->>'text', p->>'body', p->>'summary', p->>'note', '')),
    ''
  );

  if nbody is null then
    case new.action
      when 'leader_assigned_to_chapter' then
        lid := null;
        cid := null;
        begin
          if p ? 'leader_user_id' and nullif(trim(p->>'leader_user_id'), '') is not null then
            lid := (trim(p->>'leader_user_id'))::uuid;
          end if;
        exception when others then
          lid := null;
        end;
        begin
          if p ? 'chapter_id' and nullif(trim(p->>'chapter_id'), '') is not null then
            cid := (trim(p->>'chapter_id'))::uuid;
          end if;
        exception when others then
          cid := null;
        end;
        if cid is null and new.entity_id is not null then
          begin
            cid := trim(new.entity_id)::uuid;
          exception when others then
            cid := null;
          end;
        end if;

        fn := null;
        ln := null;
        if lid is not null then
          select pr.first_name, pr.last_name into fn, ln
          from public.profiles pr
          where pr.id = lid
          limit 1;
          if fn is null and ln is null then
            select du.first_name, du.last_name into fn, ln
            from public.dashboard_users du
            where du.id = lid
            limit 1;
          end if;
        end if;

        fn := nullif(trim(coalesce(fn, '')), '');
        ln := nullif(trim(coalesce(ln, '')), '');

        if fn is not null and ln is not null and length(ln) > 0 then
          short_name := fn || ' ' || upper(left(ln, 1)) || '.';
        elsif fn is not null then
          short_name := fn;
        elsif ln is not null then
          short_name := ln;
        else
          short_name := 'A member';
        end if;

        chname := null;
        if cid is not null then
          select c.name into chname from public.chapters c where c.id = cid limit 1;
        end if;
        chname := coalesce(nullif(trim(chname), ''), 'their chapter');

        nbody := short_name || ' was assigned as Local Leader at ' || chname || '.';

      when 'chapter_created' then
        ch_name := nullif(trim(p->>'name'), '');
        ch_city := nullif(trim(p->>'city'), '');
        ch_state := nullif(trim(p->>'state'), '');
        if ch_name is not null then
          if ch_city is not null and ch_state is not null then
            nbody := 'Chapter "' || ch_name || '" was created in ' || ch_city || ', ' || ch_state || '.';
          elsif ch_state is not null then
            nbody := 'Chapter "' || ch_name || '" was created (' || ch_state || ').';
          else
            nbody := 'Chapter "' || ch_name || '" was created.';
          end if;
        else
          nbody := 'A new chapter was created.';
        end if;

      when 'user_registered' then
        reg_fn := nullif(trim(p->>'first_name'), '');
        reg_ln := nullif(trim(p->>'last_name'), '');
        chap_id := null;
        begin
          if p ? 'primary_chapter_id' and nullif(trim(p->>'primary_chapter_id'), '') is not null then
            chap_id := (trim(p->>'primary_chapter_id'))::uuid;
          end if;
        exception when others then
          chap_id := null;
        end;

        chname := null;
        if chap_id is not null then
          select c.name into chname from public.chapters c where c.id = chap_id limit 1;
        end if;
        chname := nullif(trim(coalesce(chname, '')), '');

        if reg_fn is not null and reg_ln is not null and length(reg_ln) > 0 then
          short_name := reg_fn || ' ' || upper(left(reg_ln, 1)) || '.';
        elsif reg_fn is not null then
          short_name := reg_fn;
        elsif reg_ln is not null then
          short_name := reg_ln;
        else
          short_name := 'A new member';
        end if;

        if chname is not null then
          nbody := short_name || ' registered and joined ' || chname || '.';
        else
          nbody := short_name || ' registered and joined the community.';
        end if;

      when 'gathering_created' then
        gtitle := nullif(trim(p->>'title'), '');
        chap_id := null;
        begin
          if p ? 'chapter_id' and nullif(trim(p->>'chapter_id'), '') is not null then
            chap_id := (trim(p->>'chapter_id'))::uuid;
          end if;
        exception when others then
          chap_id := null;
        end;

        chname := null;
        if chap_id is not null then
          select c.name into chname from public.chapters c where c.id = chap_id limit 1;
        end if;
        chname := coalesce(nullif(trim(chname), ''), 'the chapter');

        if gtitle is not null then
          nbody := 'Gathering "' || gtitle || '" was scheduled for ' || chname || '.';
        else
          nbody := 'A new gathering was scheduled for ' || chname || '.';
        end if;

      when 'location.created' then
        loc_name := nullif(trim(p->>'name'), '');
        loc_region := nullif(trim(p->>'region'), '');
        if loc_name is not null and loc_region is not null then
          nbody := 'Location "' || loc_name || '" (' || loc_region || ') was created.';
        elsif loc_name is not null then
          nbody := 'Location "' || loc_name || '" was created.';
        else
          nbody := 'A new location was created.';
        end if;

      when 'location.updated' then
        loc_name := nullif(trim(p->>'name'), '');
        loc_region := nullif(trim(p->>'region'), '');
        if loc_name is not null and loc_region is not null then
          nbody := 'Location "' || loc_name || '" (' || loc_region || ') was updated.';
        elsif loc_name is not null then
          nbody := 'Location "' || loc_name || '" was updated.';
        else
          nbody := 'A location was updated.';
        end if;

      when 'location.deleted' then
        nbody := 'A location was removed.';

      when 'local_leader_role_granted' then
        lid := null;
        begin
          if new.entity_id is not null and length(trim(new.entity_id)) >= 32 then
            lid := trim(new.entity_id)::uuid;
          end if;
        exception when others then
          lid := null;
        end;
        if lid is null and p ? 'user_id' then
          begin
            lid := (trim(p->>'user_id'))::uuid;
          exception when others then
            lid := null;
          end;
        end if;

        fn := null;
        ln := null;
        if lid is not null then
          select pr.first_name, pr.last_name into fn, ln
          from public.profiles pr
          where pr.id = lid
          limit 1;
          if fn is null and ln is null then
            select du.first_name, du.last_name into fn, ln
            from public.dashboard_users du
            where du.id = lid
              limit 1;
          end if;
        end if;

        fn := nullif(trim(coalesce(fn, '')), '');
        ln := nullif(trim(coalesce(ln, '')), '');

        if fn is not null and ln is not null and length(ln) > 0 then
          short_name := fn || ' ' || upper(left(ln, 1)) || '.';
        elsif fn is not null then
          short_name := fn;
        elsif ln is not null then
          short_name := ln;
        else
          short_name := 'A member';
        end if;

        nbody := short_name || ' was granted the Local Leader role.';

      else
        nbody := null;
    end case;
  end if;

  if nbody is null then
    nbody := nullif(trim(p->>'name'), '');
  end if;

  if nbody is not null and nbody = ntitle then
    nbody := null;
  end if;
  if nbody is not null then
    nbody := left(nbody, 400);
  end if;

  insert into public.notifications (user_id, title, body)
  select du.id,
    left(ntitle, 200),
    case
      when nbody is null or nbody = '' then null
      else left(nbody, 480)
    end
  from public.dashboard_users du;

  return new;
end;
$$;
