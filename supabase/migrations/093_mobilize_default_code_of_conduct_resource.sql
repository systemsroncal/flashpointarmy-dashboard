-- Default "FPA Code of Conduct" PDF resource for every Mobilize group.

-- Backfill existing groups (skip if already present).
insert into public.mobilize_group_resources (
  group_id,
  author_id,
  resource_type,
  title,
  body,
  url,
  file_name,
  created_at,
  updated_at
)
select
  g.id,
  g.created_by,
  'document',
  'FPA Code of Conduct',
  null,
  '/uploads/FPA-Code-of-Conduct.pdf',
  'FPA-Code-of-Conduct.pdf',
  g.created_at,
  g.created_at
from public.mobilize_groups g
where g.created_by is not null
  and not exists (
    select 1
    from public.mobilize_group_resources r
    where r.group_id = g.id
      and r.resource_type = 'document'
      and r.url = '/uploads/FPA-Code-of-Conduct.pdf'
  );

-- Auto-seed on every new group (creator is already the leader via trg_mobilize_groups_add_leader).
create or replace function public.mobilize_groups_after_insert_default_resources()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mobilize_group_resources (
    group_id,
    author_id,
    resource_type,
    title,
    body,
    url,
    file_name
  ) values (
    new.id,
    new.created_by,
    'document',
    'FPA Code of Conduct',
    null,
    '/uploads/FPA-Code-of-Conduct.pdf',
    'FPA-Code-of-Conduct.pdf'
  );
  return new;
end;
$$;

drop trigger if exists trg_mobilize_groups_default_resources on public.mobilize_groups;
create trigger trg_mobilize_groups_default_resources
  after insert on public.mobilize_groups
  for each row execute function public.mobilize_groups_after_insert_default_resources();
