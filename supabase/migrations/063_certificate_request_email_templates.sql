-- Certificate request review email templates (approve / reject).

insert into public.email_templates (template_key, subject, body_html)
values
  (
    'certificate_request_approved',
    'Your {course_title} certificate was approved',
    '<p>Hello {user_fullname},</p>
<p>Great news — your external completion request for <strong>{course_title}</strong> was approved.</p>
<p>Your Biblical Citizenship training progress in the dashboard has been updated. You can continue with your Mission Briefing:</p>
<p><a href="{mission_briefing_url}">Continue to Mission Briefing</a></p>
<p>{admin_note_html}</p>
<p>If the button does not work, copy and paste this link into your browser:<br/>{mission_briefing_url}</p>
<p>— {app_name}</p>'
  ),
  (
    'certificate_request_rejected',
    'Update on your {course_title} certificate request',
    '<p>Hello {user_fullname},</p>
<p>Your external completion request for <strong>{course_title}</strong> was reviewed and was not approved at this time.</p>
<p>{admin_note_html}</p>
<p>If you have questions, contact your chapter leader or reply to any follow-up from our team.</p>
<p>— {app_name}</p>'
  )
on conflict (template_key) do nothing;
