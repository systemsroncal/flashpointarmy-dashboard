import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCOUNT_VERIFIED_EMAIL_TEMPLATE = {
  template_key: "account_verified",
  subject: "Your account is verified",
  body_html: `<p>Hello {user_fullname},</p>
<p>Your <strong>FlashPoint Army</strong> account has been verified. You now have the verified badge on your profile in Mobilize.</p>
<p><a href="{profile_url}">View your profile</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br/>{profile_url}</p>
<p>Thank you for serving with us.</p>
<p>— {app_name}</p>`,
} as const;

export async function ensureAccountVerifiedEmailTemplate(admin: SupabaseClient): Promise<void> {
  await admin.from("email_templates").upsert(
    {
      template_key: ACCOUNT_VERIFIED_EMAIL_TEMPLATE.template_key,
      subject: ACCOUNT_VERIFIED_EMAIL_TEMPLATE.subject,
      body_html: ACCOUNT_VERIFIED_EMAIL_TEMPLATE.body_html,
    },
    { onConflict: "template_key", ignoreDuplicates: true }
  );
}