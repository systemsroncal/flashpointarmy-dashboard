-- Track acceptance of group leader responsibilities / terms per membership row.

alter table public.mobilize_group_members
  add column if not exists leader_terms_accepted_at timestamptz;

comment on column public.mobilize_group_members.leader_terms_accepted_at is
  'When set, the user accepted leader terms for this group; null means a promotion popup is pending.';

-- Existing approved leaders are grandfathered; only future promotions reset this field in app code.
update public.mobilize_group_members
set leader_terms_accepted_at = now()
where membership_status = 'approved'
  and member_role = 'leader'
  and leader_terms_accepted_at is null;