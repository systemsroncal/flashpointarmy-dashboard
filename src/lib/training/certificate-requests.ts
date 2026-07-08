import {
  BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  isUserCourseComplete,
} from "@/lib/courses/course-completion";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Member / local leader certificate request form — on; file upload step is hidden in UI for now. */
export function isExternalCertificateSubmissionEnabled(roleNames: string[]): boolean {
  if (isElevatedRole(roleNames)) return true;
  if (roleNames.includes("member") || roleNames.includes("local_leader")) return true;
  return true;
}

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

export type ExternalCertificateCtaState = {
  /** Show inline Patriot Academy CTA or pending-review message. */
  show: boolean;
  /** User already submitted a request awaiting admin review. */
  pendingReview: boolean;
};

/** Shared visibility rules for training landing and Biblical Citizenship course hero. */
export async function loadExternalCertificateCtaState(
  supabase: SupabaseClient,
  userId: string,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  roleNames?: string[]
): Promise<ExternalCertificateCtaState> {
  const roles = roleNames ?? (await loadUserRoleNames(supabase, userId));
  if (!isExternalCertificateSubmissionEnabled(roles)) {
    return { show: false, pendingReview: false };
  }

  const complete = await isUserCourseComplete(supabase, userId, courseSlug);
  if (complete) return { show: false, pendingReview: false };

  const courseId = await resolveCourseIdBySlug(supabase, courseSlug);
  if (!courseId) return { show: false, pendingReview: false };

  const pending = await userHasPendingCertificateRequest(supabase, userId, courseId);
  if (pending) return { show: true, pendingReview: true };

  return { show: true, pendingReview: false };
}

export async function shouldShowExternalCertificatePrompt(
  supabase: SupabaseClient,
  userId: string,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  roleNames?: string[]
): Promise<boolean> {
  const state = await loadExternalCertificateCtaState(supabase, userId, courseSlug, roleNames);
  return state.show;
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

export function hasCertificateAttachment(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}
