import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { EmailsSettingsClient } from "@/components/dashboard/emails/EmailsSettingsClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { ensureMissionUpdateNewEmailTemplate } from "@/lib/mail/ensure-mission-update-email-template";
import { requireServerUser } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";

export default async function EmailsPageContent({
  initialTab,
  gmailConnected,
  gmailError,
}: {
  initialTab?: string;
  gmailConnected?: boolean;
  gmailError?: string;
}) {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.emails, "read")) {
    return <AccessDenied message="You do not have access to email settings." />;
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const isSuperAdmin = isSuperAdminUser(roleNames);

  const canEdit = can(permissions, MODULE_SLUGS.emails, "update");

  try {
    await ensureMissionUpdateNewEmailTemplate(createAdminClient());
  } catch (e) {
    console.error("[emails] ensure mission_update_new template:", e);
  }

  const [{ data: branding }, { data: templates }, logsResult] = await Promise.all([
    supabase.from("email_branding_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("email_templates").select("id, template_key, subject, body_html").order("template_key"),
    supabase
      .from("email_send_logs")
      .select(
        "id, created_at, status, template_key, from_address, to_address, subject, body_preview, error_message, triggered_by_user_id"
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const initialLogs = logsResult.error ? [] : (logsResult.data ?? []);

  return (
    <EmailsSettingsClient
      isSuperAdmin={isSuperAdmin}
      initialBranding={
        branding ?? {
          logo_url: null,
          logo_bg_color: "#111111",
          container_bg_color: "#0b0b0d",
          body_bg_color: "#101215",
          body_text_color: "#e5e7eb",
          body_link_color: "#c9a227",
          footer_text_color: "#a1a1aa",
          footer_html: "<p>© {current_year}</p>",
        }
      }
      initialTemplates={(templates ?? []) as { id: string; template_key: string; subject: string; body_html: string }[]}
      initialLogs={initialLogs}
      defaultTestEmail={user.email ?? ""}
      canEdit={canEdit}
      initialTab={initialTab}
      gmailConnected={gmailConnected}
      gmailError={gmailError}
    />
  );
}
