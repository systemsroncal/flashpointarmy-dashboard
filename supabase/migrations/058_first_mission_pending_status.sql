-- Allow pending status on first mission (unlocked after coach meeting completed).

alter table public.member_first_missions
  drop constraint if exists member_first_missions_status_check;

alter table public.member_first_missions
  add constraint member_first_missions_status_check
  check (status in ('locked', 'pending', 'in_progress', 'completed'));
