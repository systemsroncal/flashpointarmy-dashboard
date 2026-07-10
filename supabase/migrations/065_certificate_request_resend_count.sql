-- Track how many times a reviewed certificate-request notification was resent.

alter table public.course_certificate_requests
  add column if not exists notification_resend_count integer not null default 0;

alter table public.course_certificate_requests
  drop constraint if exists course_certificate_requests_notification_resend_count_check;

alter table public.course_certificate_requests
  add constraint course_certificate_requests_notification_resend_count_check
  check (notification_resend_count >= 0);
