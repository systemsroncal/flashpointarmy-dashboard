-- Default featured subgroup for Texas chapter group list (idempotent).
update public.mobilize_groups
set is_featured = true
where parent_group_id is not null
  and (
    name ilike 'Church of Champions – Houston, Texas'
    or name ilike 'Church of Champions - Houston, Texas'
  );