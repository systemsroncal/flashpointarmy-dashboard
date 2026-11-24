-- Email when a super admin verifies a member account (Mobilize verified badge).

insert into public.email_templates (template_key, subject, body_html)
values
  (
    'account_verified',
    'Your account is verified',
    '<p>Hello {user_fullname},</p>
<p>Your <strong>FlashPoint Army</strong> account has been verified. You now have the verified badge on your profile in Mobilize.</p>
<p><a href="{profile_url}">View your profile</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br/>{profile_url}</p>
<p>Thank you for serving with us.</p>
<p>— {app_name}</p>'
  )
on conflict (template_key) do nothing;