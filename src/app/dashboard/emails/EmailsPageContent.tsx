import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { EmailsSettingsClient } from "@/components/dashboard/emails/EmailsSettingsClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function EmailsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.emails, "read")) {
    return <AccessDenied message="You do not have access to email settings." />;
  }

  const canEdit = can(permissions, MODULE_SLUGS.emails, "update");

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
      initialBranding={
        branding ?? {
          logo_url: null,
          logo_bg_color: "#111111",
          container_bg_color: "#0b0b0d",
          footer_html: "<p>© {current_year}</p>",
        }
      }
      initialTemplates={(templates ?? []) as { id: string; template_key: string; subject: string; body_html: string }[]}
      initialLogs={initialLogs}
      defaultTestEmail={user.email ?? ""}
      canEdit={canEdit}
    />
  );
}
