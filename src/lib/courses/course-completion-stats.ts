import type { SupabaseClient } from "@supabase/supabase-js";
import { listRoleNamesByUserIds } from "@/lib/admin/dashboard-user-queries";

export type CourseCompletionRow = {
  courseId: string;
  title: string;
  totalSessions: number;
  leaderStarted: number;
  leaderCompleted: number;
  memberStarted: number;
  memberCompleted: number;
  leaderPercent: number;
  memberPercent: number;
};

export type ProgressRoleBucket = "leader" | "member" | "other";

/** Same bucket rules as /dashboard/reports course completion (leader > member > other). */
export function progressRoleBucketFromSlugs(slugs: string[]): ProgressRoleBucket {
  const set = new Set(slugs);
  if (set.has("local_leader")) return "leader";
  if (set.has("member")) return "member";
  return "other";
}

type ProgressRow = {
  user_id: string;
  session_id: string;
  completed_at: string | null;
};

/**
 * Build leaders vs. members started/completed stats for one course
 * (identical logic to `/api/reports/dashboard` courseCompletion).
 */
export async function computeCourseCompletionRow(
  admin: SupabaseClient,
  course: { id: string; title: string },
  sessionIds: string[],
  progressRows: ProgressRow[]
): Promise<CourseCompletionRow> {
  const totalSessions = sessionIds.length;
  const sessionSet = new Set(sessionIds);
  const startedSet = new Set<string>();
  const completedByUser = new Map<string, Set<string>>();

  for (const p of progressRows) {
    if (!sessionSet.has(p.session_id)) continue;
    startedSet.add(p.user_id);
    if (!p.completed_at) continue;
    const seen = completedByUser.get(p.user_id) ?? new Set<string>();
    seen.add(p.session_id);
    completedByUser.set(p.user_id, seen);
  }

  const roleMap =
    startedSet.size > 0
      ? await listRoleNamesByUserIds(admin, [...startedSet])
      : new Map<string, string[]>();

  let leaderStarted = 0;
  let memberStarted = 0;
  let leaderCompleted = 0;
  let memberCompleted = 0;

  for (const uid of startedSet) {
    const bucket = progressRoleBucketFromSlugs(roleMap.get(uid) ?? []);
    if (bucket === "leader") leaderStarted += 1;
    else if (bucket === "member") memberStarted += 1;
  }

  if (totalSessions > 0) {
    for (const [uid, sessions] of completedByUser) {
      if (sessions.size < totalSessions) continue;
      const bucket = progressRoleBucketFromSlugs(roleMap.get(uid) ?? []);
      if (bucket === "leader") leaderCompleted += 1;
      else if (bucket === "member") memberCompleted += 1;
    }
  }

  const leaderPercent =
    leaderStarted > 0 ? Math.round((leaderCompleted / leaderStarted) * 100) : 0;
  const memberPercent =
    memberStarted > 0 ? Math.round((memberCompleted / memberStarted) * 100) : 0;

  return {
    courseId: course.id,
    title: course.title,
    totalSessions,
    leaderStarted,
    leaderCompleted,
    memberStarted,
    memberCompleted,
    leaderPercent,
    memberPercent,
  };
}
