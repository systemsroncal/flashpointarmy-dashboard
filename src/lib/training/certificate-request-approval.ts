import { notifyCertificateRequestReviewed } from "@/lib/notifications/certificate-request-notification";
import { markAllCourseSessionsCompleteForUser } from "@/lib/training/certificate-requests";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-only: auto-approve a certificate request and mark course sessions complete. */
export async function approveCertificateRequestRecord(
  admin: SupabaseClient,
  args: {
    requestId: string;
    userId: string;
    courseSlug: string;
    courseTitle: string;
    reviewedBy: string;
    adminNote?: string | null;
  }
): Promise<{ sessionCount: number; emailSent: boolean; emailError?: string }> {
  const reviewedAt = new Date().toISOString();
  const { error: updateErr } = await admin
    .from("course_certificate_requests")
    .update({
      status: "approved",
      admin_note: args.adminNote?.trim() || null,
      reviewed_by: args.reviewedBy,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq("id", args.requestId);

  if (updateErr) throw new Error(updateErr.message);

  const result = await markAllCourseSessionsCompleteForUser(admin, args.userId, args.courseSlug);

  try {
    await notifyCertificateRequestReviewed(admin, {
      userId: args.userId,
      courseTitle: args.courseTitle,
      status: "approved",
      adminNote: args.adminNote ?? null,
      reviewedBy: args.reviewedBy,
    });
    return { ...result, emailSent: true };
  } catch (err) {
    const emailError = err instanceof Error ? err.message : String(err);
    console.error("[certificate-request-approval] review notification failed:", err);
    return { ...result, emailSent: false, emailError };
  }
}
