import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

export type CourseSessionProgressRow = {
  user_id: string;
  session_id: string;
  completed_at: string | null;
};

/**
 * PostgREST returns at most 1000 rows per request. Course progress pages and
 * reports must paginate or counts stay stuck (~300–400 users on multi-session courses).
 */
export async function fetchCourseSessionProgressForSessions(
  admin: SupabaseClient,
  sessionIds: string[],
  opts?: { userIds?: string[] }
): Promise<CourseSessionProgressRow[]> {
  if (!sessionIds.length) return [];

  const out: CourseSessionProgressRow[] = [];
  let offset = 0;

  for (;;) {
    let query = admin
      .from("course_session_progress")
      .select("user_id, session_id, completed_at")
      .in("session_id", sessionIds)
      .order("user_id", { ascending: true })
      .order("session_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (opts?.userIds?.length) {
      query = query.in("user_id", opts.userIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as CourseSessionProgressRow[];
    out.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return out;
}

export async function fetchAllCourseSessionProgress(
  admin: SupabaseClient
): Promise<CourseSessionProgressRow[]> {
  const out: CourseSessionProgressRow[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin
      .from("course_session_progress")
      .select("user_id, session_id, completed_at")
      .order("user_id", { ascending: true })
      .order("session_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = (data ?? []) as CourseSessionProgressRow[];
    out.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return out;
}

export type CourseQuizResultRow = {
  user_id: string;
  score: number;
  max_score: number;
};

export async function fetchCourseQuizResultsForElements(
  admin: SupabaseClient,
  elementIds: string[]
): Promise<CourseQuizResultRow[]> {
  if (!elementIds.length) return [];

  const out: CourseQuizResultRow[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin
      .from("course_quiz_results")
      .select("user_id, score, max_score")
      .in("element_id", elementIds)
      .order("user_id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = (data ?? []) as CourseQuizResultRow[];
    out.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return out;
}
