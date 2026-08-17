-- Public (listed) groups must auto-join.
--
-- visibility=public and enrollment_mode=request_to_join were independent, so a
-- group could show as "Public" while new members landed in Pending requests.
-- Align existing rows and approve those pending memberships.
--
-- Safe to run multiple times.

update public.mobilize_groups
set enrollment_mode = 'open_signup'
where visibility is distinct from 'private'
  and enrollment_mode = 'request_to_join'
  and parent_group_id is not null;

update public.mobilize_group_members m
set membership_status = 'approved'
from public.mobilize_groups g
where m.group_id = g.id
  and m.membership_status = 'pending'
  and g.parent_group_id is not null
  and g.visibility is distinct from 'private'
  and g.enrollment_mode = 'open_signup';
