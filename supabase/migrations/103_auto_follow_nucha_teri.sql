-- Auto-follow Nucha Diaz and Teri Bailey for eligible dashboard users.

insert into public.mobilize_auto_follow_targets (user_id)
select du.id
from public.dashboard_users du
where lower(du.email) in (
  'nucha@dreamsanimation.com',
  'teri@fparmy.com'
)
on conflict (user_id) do nothing;

insert into public.mobilize_user_follows (follower_id, following_id)
select distinct ur.user_id, t.user_id
from public.mobilize_auto_follow_targets t
join public.dashboard_users target on target.id = t.user_id
join public.user_roles ur on ur.user_id <> t.user_id
join public.roles r on r.id = ur.role_id
where lower(target.email) in (
  'nucha@dreamsanimation.com',
  'teri@fparmy.com'
)
  and r.name in ('member', 'local_leader', 'admin', 'sub_admin', 'super_admin')
on conflict (follower_id, following_id) do nothing;
