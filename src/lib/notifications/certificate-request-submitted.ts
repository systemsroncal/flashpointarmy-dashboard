import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrivacyName } from "@/lib/user/format-privacy-name";

/** Notify admins (via notification_events + audit) when a certificate request is submitted. */
export async function notifyCertificateRequestSubmitted(
  admin: SupabaseClient,
  args: {
    userId: string;
    courseTitle: string;
    organizationName: string;
  }
): Promise<void> {
  const [{ data: prof }, { data: du }] = await Promise.all([
    admin.from("profiles").select("first_name, last_name").eq("id", args.userId).maybeSingle(),
    admin
      .from("dashboard_users")
      .select("first_name, last_name, email")
      .eq("id", args.userId)
      .maybeSingle(),
  ]);

  const first = (prof?.first_name as string | null) ?? (du?.first_name as string | null) ?? null;
  const last = (prof?.last_name as string | null) ?? (du?.last_name as string | null) ?? null;
  const email = (du?.email as string | undefined) ?? "";
  const who =
    formatPrivacyName(first, last) !== "A member"
      ? formatPrivacyName(first, last)
      : email.split("@")[0] || "A member";

  const body = `${who} confirmed prior BibCit`;

  await admin.from("audit_logs").insert({
    user_id: args.userId,
    action: "certificate_request_submitted",
    entity_type: "course_certificate_request",
    entity_id: args.userId,
    payload: {
      title: `${who} confirmed prior BibCit`,
      text: body,
      course_title: args.courseTitle,
      organization_name: args.organizationName,
    },
  });
}
