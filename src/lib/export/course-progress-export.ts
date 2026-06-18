import {
  listDashboardUsersByIds,
  listProfilesByIds,
  listRoleNamesByUserIds,
  preferNonEmptyAddr,
} from "@/lib/admin/dashboard-user-queries";
import { progressRoleBucketFromSlugs } from "@/lib/courses/course-completion-stats";
import {
  filterCountableSessionIds,
  type SessionElementTypeRow,
} from "@/lib/courses/session-counting";
import { fetchCourseSessionProgressForSessions } from "@/lib/courses/fetch-course-session-progress";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CourseProgressExportRoleFilter = "all" | "member" | "leader";

export async function buildCourseProgressExportRows(
  admin: SupabaseClient,
  courseId: string,
  opts?: {
    roleFilter?: CourseProgressExportRoleFilter;
    chapterId?: string;
    stateFilter?: string;
  }
): Promise<{ rows: Record<string, string | number>[]; courseTitle: string; totalSessions: number }> {
  const { data: course, error: courseErr } = await admin
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .maybeSingle();
  if (courseErr) throw new Error(courseErr.message);
  if (!course) throw new Error("Course not found.");

  const { data: sessions } = await admin
    .from("course_sessions")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id as string);

  const elementsBySession = new Map<string, SessionElementTypeRow[]>();
  if (sessionIds.length) {
    const { data: elRows } = await admin
      .from("course_elements")
      .select("session_id, element_type")
      .in("session_id", sessionIds);
    for (const row of elRows ?? []) {
      const sid = row.session_id as string;
      const list = elementsBySession.get(sid) ?? [];
      list.push({ element_type: row.element_type as string });
      elementsBySession.set(sid, list);
    }
  }

  const countableSessionIds = filterCountableSessionIds(sessionRows, elementsBySession);
  const countableSet = new Set(countableSessionIds);
  const totalSessions = countableSessionIds.length;
  if (!totalSessions) {
    return { rows: [], courseTitle: course.title as string, totalSessions: 0 };
  }

  const prog = await fetchCourseSessionProgressForSessions(admin, sessionIds);

  const byUser = new Map<string, number>();
  for (const row of prog) {
    if (!countableSet.has(row.session_id as string)) continue;
    if (!row.completed_at) continue;
    const uid = row.user_id as string;
    byUser.set(uid, (byUser.get(uid) ?? 0) + 1);
  }

  let userIds = [...byUser.keys()];
  const roleByUser = userIds.length ? await listRoleNamesByUserIds(admin, userIds) : new Map<string, string[]>();

  const roleFilter = opts?.roleFilter ?? "all";
  userIds = userIds.filter((uid) => {
    const bucket = progressRoleBucketFromSlugs(roleByUser.get(uid) ?? []);
    if (roleFilter === "member") return bucket === "member";
    if (roleFilter === "leader") return bucket === "leader";
    return bucket === "member" || bucket === "leader";
  });

  const chapterId = opts?.chapterId?.trim();
  const stateFilter = opts?.stateFilter?.trim().toUpperCase();
  if ((chapterId && chapterId !== "all") || (stateFilter && stateFilter !== "ALL")) {
    const duRows = userIds.length ? await listDashboardUsersByIds(admin, userIds) : [];
    const profileRows = userIds.length ? await listProfilesByIds(admin, userIds) : [];
    const profileById = new Map(profileRows.map((p) => [p.id as string, p]));
    const { data: chapters } = await admin.from("chapters").select("id, state");
    const stateByChapter = new Map((chapters ?? []).map((c) => [c.id as string, c.state as string]));

    userIds = userIds.filter((uid) => {
      const du = duRows.find((d) => d.id === uid);
      const profile = profileById.get(uid);
      const pid = profile?.primary_chapter_id ?? du?.primary_chapter_id ?? null;
      if (chapterId && chapterId !== "all") return pid === chapterId;
      if (stateFilter && stateFilter !== "ALL") {
        const st = (profile?.state ?? du?.state ?? (pid ? stateByChapter.get(pid) : null) ?? "")
          .trim()
          .toUpperCase()
          .slice(0, 2);
        return st === stateFilter;
      }
      return true;
    });
  }

  const duRows = userIds.length ? await listDashboardUsersByIds(admin, userIds) : [];
  const profileRows = userIds.length ? await listProfilesByIds(admin, userIds) : [];
  const profileById = new Map(profileRows.map((p) => [p.id as string, p]));
  const duById = new Map(duRows.map((d) => [d.id, d]));

  const exportRows = userIds
    .map((uid) => {
      const du = duById.get(uid);
      const profile = profileById.get(uid);
      const done = byUser.get(uid) ?? 0;
      const pct = totalSessions > 0 ? Math.round((done / totalSessions) * 100) : 0;
      const slugs = roleByUser.get(uid) ?? [];
      const roleLabel = slugs.includes("local_leader")
        ? "Local leader"
        : slugs.includes("member")
          ? "Member"
          : slugs.join(", ");

      return {
        "First name": du?.first_name ?? "",
        "Last name": du?.last_name ?? "",
        Email: du?.email ?? "",
        State: preferNonEmptyAddr(profile?.state, du?.state) ?? "",
        Phone: preferNonEmptyAddr(profile?.phone, du?.phone) ?? "",
        Role: roleLabel,
        Progress: `${done}/${totalSessions}`,
        "Progress %": `${pct}%`,
        "Sessions completed": done,
        "Total sessions": totalSessions,
        "User ID": uid,
      };
    })
    .sort((a, b) =>
      String(a["Last name"]).localeCompare(String(b["Last name"]), undefined, { sensitivity: "base" })
    );

  return {
    rows: exportRows,
    courseTitle: course.title as string,
    totalSessions,
  };
}
