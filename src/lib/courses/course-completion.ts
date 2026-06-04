import type { SupabaseClient } from "@supabase/supabase-js";
import {
  filterCountableSessionIds,
  type SessionElementTypeRow,
} from "@/lib/courses/session-counting";

/** Primary training course — `/dashboard/course/biblical-citizenship`. */
export const BIBLICAL_CITIZENSHIP_COURSE_SLUG = "biblical-citizenship";

export type TrainingGraduateBadgeRole = "local_leader" | "member";

/** Graduate badge is only shown for members and local leaders (not admin-only accounts). */
export function graduateBadgeRoleFromRoles(roleNames: string[]): TrainingGraduateBadgeRole | null {
  if (roleNames.includes("local_leader")) return "local_leader";
  if (roleNames.includes("member")) return "member";
  return null;
}

/** Learner-facing sessions only (excludes quiz-only placeholder sessions). */
async function loadCourseSessionIds(
  supabase: SupabaseClient,
  courseSlug: string
): Promise<string[]> {
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .maybeSingle();
  if (!course?.id) return [];

  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("id, sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });
  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id as string);
  if (!sessionIds.length) return [];

  const elementsBySession = new Map<string, SessionElementTypeRow[]>();
  const { data: elRows } = await supabase
    .from("course_elements")
    .select("session_id, element_type")
    .in("session_id", sessionIds);
  for (const row of elRows ?? []) {
    const sid = row.session_id as string;
    const list = elementsBySession.get(sid) ?? [];
    list.push({ element_type: row.element_type as string });
    elementsBySession.set(sid, list);
  }

  return filterCountableSessionIds(
    sessionRows.map((s) => ({ id: s.id as string })),
    elementsBySession
  );
}

function userCompletedAllSessions(
  sessionIds: string[],
  progressRows: { session_id: string; completed_at: string | null }[]
): boolean {
  if (!sessionIds.length) return false;
  const done = new Set(
    progressRows.filter((r) => r.completed_at).map((r) => r.session_id as string)
  );
  return sessionIds.every((id) => done.has(id));
}

/** Whether a user finished every session in the course. */
export async function isUserCourseComplete(
  supabase: SupabaseClient,
  userId: string,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG
): Promise<boolean> {
  const sessionIds = await loadCourseSessionIds(supabase, courseSlug);
  if (!sessionIds.length) return false;

  const { data: prog } = await supabase
    .from("course_session_progress")
    .select("session_id, completed_at")
    .eq("user_id", userId)
    .in("session_id", sessionIds);

  return userCompletedAllSessions(sessionIds, prog ?? []);
}

/** Badge role for the current user, or null if not a graduate / not member or local leader. */
export async function loadTrainingGraduateBadge(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[],
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG
): Promise<TrainingGraduateBadgeRole | null> {
  const badgeRole = graduateBadgeRoleFromRoles(roleNames);
  if (!badgeRole) return null;
  const complete = await isUserCourseComplete(supabase, userId, courseSlug);
  return complete ? badgeRole : null;
}

type UserRoleRow = {
  user_id: string;
  roles: { name: string } | { name: string }[] | null;
};

/** Batch lookup for community / admin lists (service role). */
export async function loadTrainingGraduateBadgesForUsers(
  admin: SupabaseClient,
  userIds: string[],
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG
): Promise<Map<string, TrainingGraduateBadgeRole>> {
  const result = new Map<string, TrainingGraduateBadgeRole>();
  if (!userIds.length) return result;

  const sessionIds = await loadCourseSessionIds(admin, courseSlug);
  const total = sessionIds.length;
  if (!total) return result;

  const { data: prog } = await admin
    .from("course_session_progress")
    .select("user_id, session_id, completed_at")
    .in("user_id", userIds)
    .in("session_id", sessionIds);

  const completedByUser = new Map<string, Set<string>>();
  for (const row of prog ?? []) {
    if (!row.completed_at) continue;
    const uid = row.user_id as string;
    const set = completedByUser.get(uid) ?? new Set<string>();
    set.add(row.session_id as string);
    completedByUser.set(uid, set);
  }

  const graduateIds = userIds.filter((uid) => {
    const set = completedByUser.get(uid);
    return set != null && sessionIds.every((id) => set.has(id));
  });
  if (!graduateIds.length) return result;

  const { data: roleRows } = await admin
    .from("user_roles")
    .select("user_id, roles(name)")
    .in("user_id", graduateIds);

  const rolesByUser = new Map<string, string[]>();
  for (const row of (roleRows ?? []) as UserRoleRow[]) {
    const uid = String(row.user_id);
    const rel = row.roles;
    const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
    if (!name) continue;
    const arr = rolesByUser.get(uid) ?? [];
    if (!arr.includes(name)) arr.push(name);
    rolesByUser.set(uid, arr);
  }

  for (const uid of graduateIds) {
    const badge = graduateBadgeRoleFromRoles(rolesByUser.get(uid) ?? []);
    if (badge) result.set(uid, badge);
  }

  return result;
}
