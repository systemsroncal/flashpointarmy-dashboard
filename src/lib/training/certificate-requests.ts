import {
  BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  isUserCourseComplete,
} from "@/lib/courses/course-completion";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CertificateRequestStatus = "pending" | "approved" | "rejected";

export type CertificateRequestRow = {
  id: string;
  user_id: string;
  course_id: string;
  completed_training_confirmed: boolean;
  completion_date: string;
  organization_name: string;
  certificate_url: string;
  certificate_file_name: string | null;
  certificate_mime: string | null;
  status: CertificateRequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function resolveCourseIdBySlug(
  supabase: SupabaseClient,
  courseSlug: string
): Promise<string | null> {
  const { data } = await supabase.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function userHasPendingCertificateRequest(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("course_certificate_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function shouldShowExternalCertificatePrompt(
  supabase: SupabaseClient,
  userId: string,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG
): Promise<boolean> {
  const complete = await isUserCourseComplete(supabase, userId, courseSlug);
  if (complete) return false;
  const courseId = await resolveCourseIdBySlug(supabase, courseSlug);
  if (!courseId) return false;
  const pending = await userHasPendingCertificateRequest(supabase, userId, courseId);
  return !pending;
}

/** Marks every session in the course complete for the user (admin / approval flow). */
export async function markAllCourseSessionsCompleteForUser(
  admin: SupabaseClient,
  userId: string,
  courseSlug: string
): Promise<{ sessionCount: number }> {
  const { data: course } = await admin.from("courses").select("id").eq("slug", courseSlug).maybeSingle();
  if (!course?.id) throw new Error("Course not found.");

  const { data: sessions } = await admin
    .from("course_sessions")
    .select("id")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const completedAt = new Date().toISOString();
  for (const s of sessions ?? []) {
    const { error } = await admin.from("course_session_progress").upsert(
      {
        user_id: userId,
        session_id: s.id as string,
        completed_at: completedAt,
      },
      { onConflict: "user_id,session_id" }
    );
    if (error) throw new Error(error.message);
  }

  return { sessionCount: sessions?.length ?? 0 };
}
