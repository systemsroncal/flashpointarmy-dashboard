import type { SupabaseClient } from "@supabase/supabase-js";

type NotifyParams = {
  userId: string;
  courseTitle: string;
  status: "approved" | "rejected";
  adminNote: string | null;
  reviewedBy: string;
};

/** Creates a personal dashboard announcement for the learner (bell badge + /dashboard/notifications). */
export async function notifyCertificateRequestReviewed(
  admin: SupabaseClient,
  { userId, courseTitle, status, adminNote, reviewedBy }: NotifyParams
): Promise<void> {
  const title =
    status === "approved"
      ? `${courseTitle} certificate approved`
      : `${courseTitle} certificate request update`;

  const lines =
    status === "approved"
      ? [
          `Your external ${courseTitle} completion request was approved.`,
          "Your Biblical Citizenship training progress in the dashboard has been updated.",
        ]
      : [
          `Your external ${courseTitle} completion request was reviewed and was not approved at this time.`,
          "If you have questions, contact your chapter leader or reply to any follow-up from our team.",
        ];

  const trimmedNote = adminNote?.trim();
  if (trimmedNote) {
    lines.push(`Note from our team: ${trimmedNote}`);
  }

  const ctas =
    status === "approved"
      ? [
          {
            label: "View training",
            url: "/dashboard/training",
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
