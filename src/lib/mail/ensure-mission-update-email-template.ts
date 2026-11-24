import type { SupabaseClient } from "@supabase/supabase-js";

export const MISSION_UPDATE_NEW_EMAIL_TEMPLATE = {
  template_key: "mission_update_new",
  subject: "New Mission Update: {mission_update_title}",
  body_html: `<p>Hello {user_fullname},</p>
<p>There is a new <strong>Mission Update</strong> in the Command Center.</p>
<p><strong>{mission_update_title}</strong></p>
{mission_update_preview_html}
<p><a href="{mission_update_url}">Read Mission Update</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br/>{mission_update_url}</p>
<p>— {app_name}</p>`,
} as const;

/** Inserts the Mission Update template when missing (does not overwrite admin edits). */
export async function ensureMissionUpdateNewEmailTemplate(admin: SupabaseClient): Promise<void> {
  const { error } = await admin.from("email_templates").upsert(
    {
      template_key: MISSION_UPDATE_NEW_EMAIL_TEMPLATE.template_key,
      subject: MISSION_UPDATE_NEW_EMAIL_TEMPLATE.subject,
      body_html: MISSION_UPDATE_NEW_EMAIL_TEMPLATE.body_html,
    },
    { onConflict: "template_key", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);
}