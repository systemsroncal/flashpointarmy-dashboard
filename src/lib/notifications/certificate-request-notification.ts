import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";

type NotifyParams = {
  userId: string;
  courseTitle: string;
  status: "approved" | "rejected";
  adminNote: string | null;
  reviewedBy: string;
  /** When true, skip creating a new in-app announcement (email only). */
  emailOnly?: boolean;
  /** When true, skip email and only create the in-app announcement. */
  announcementOnly?: boolean;
};

async function resolveUserContact(
  admin: SupabaseClient,
  userId: string
): Promise<{ name: string; email: string }> {
  const [{ data: du }, { data: prof }] = await Promise.all([
    admin
      .from("dashboard_users")
      .select("first_name, last_name, display_name, email")
      .eq("id", userId)
      .maybeSingle(),
    admin.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
  ]);

  const first =
    (prof?.first_name as string | null) ?? (du?.first_name as string | null) ?? null;
  const last = (prof?.last_name as string | null) ?? (du?.last_name as string | null) ?? null;
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    (du?.display_name as string | null)?.trim() ||
    (du?.email as string | undefined)?.split("@")[0] ||
    "there";
  const email = ((du?.email as string | undefined) ?? "").trim();
  return { name, email };
}

/** Creates a personal dashboard announcement and/or sends the review email. */
export async function notifyCertificateRequestReviewed(
  admin: SupabaseClient,
  {
    userId,
    courseTitle,
    status,
    adminNote,
    reviewedBy,
    emailOnly = false,
    announcementOnly = false,
  }: NotifyParams
): Promise<void> {
  const trimmedNote = adminNote?.trim() || null;
  const { name, email } = await resolveUserContact(admin, userId);
  const siteBase = await getAppBaseUrl(admin);
  const missionBriefingUrl = `${siteBase}/dashboard/training/mission-briefing`;
  const trainingUrl = `${siteBase}/dashboard/training`;

  if (!emailOnly) {
    const title =
      status === "approved"
        ? `${courseTitle} certificate approved`
        : `${courseTitle} certificate request update`;

    const lines =
      status === "approved"
        ? [
            `Your external ${courseTitle} completion request was approved.`,
            "Your Biblical Citizenship training progress in the dashboard has been updated.",
            "You can continue with your Mission Briefing.",
          ]
        : [
            `Your external ${courseTitle} completion request was reviewed and was not approved at this time.`,
            "If you have questions, contact your chapter leader or reply to any follow-up from our team.",
          ];

    if (trimmedNote) {
      lines.push(`Note from our team: ${trimmedNote}`);
    }

    const ctas =
      status === "approved"
        ? [
            {
              label: "Continue to Mission Briefing",
              url: "/dashboard/training/mission-briefing",
              open_in_new_tab: false,
              bg_color: "#c9a227",
              text_color: "#0a0a0a",
            },
          ]
        : [];

    const { error } = await admin.from("dashboard_announcements").insert({
      title,
      description: lines.join("\n\n"),
      audience: "everyone",
      target_user_id: userId,
      read_more_collapsed: false,
      ctas,
      created_by: reviewedBy,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
  }

  if (!announcementOnly) {
    if (!email || !email.includes("@")) {
      throw new Error("User email is missing; cannot send certificate review email.");
    }

    const templateKey =
      status === "approved" ? "certificate_request_approved" : "certificate_request_rejected";

    const adminNoteHtml = trimmedNote
      ? `<p><strong>Note from our team:</strong> ${escapeHtml(trimmedNote)}</p>`
      : "";

    await sendTemplatedEmail(
      templateKey,
      email,
      {
        user_fullname: name,
        user_email: email,
        course_title: courseTitle,
        admin_note: trimmedNote ?? "",
        admin_note_html: adminNoteHtml,
        mission_briefing_url: missionBriefingUrl,
        training_url: trainingUrl,
        app_name: "FlashPoint Army Chapters",
        validateemail_url: "",
        resetpassword_url: "",
        gathering_title: "",
        gathering_url: "",
      },
      { triggeredByUserId: reviewedBy }
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
