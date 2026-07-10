import { CourseProgressPageClient } from "@/components/dashboard/courses/CourseProgressPageClient";
import { MODULE_SLUGS } from "@/config/modules";
import { isChapterStaffRole, isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Paper, Typography } from "@mui/material";
import {
  listDashboardUsersByIds,
  listProfilesByIds,
  listRoleNamesByUserIds,
  preferNonEmptyAddr,
} from "@/lib/admin/dashboard-user-queries";
import { graduateBadgeRoleFromRoles } from "@/lib/courses/course-completion";
import {
  computeCourseCompletionRow,
  progressRoleBucketFromSlugs,
} from "@/lib/courses/course-completion-stats";
import {
  filterCountableSessionIds,
  isQuizOnlySession,
  type SessionElementTypeRow,
} from "@/lib/courses/session-counting";
import {
  fetchCourseQuizResultsForElements,
  fetchCourseSessionProgressForSessions,
} from "@/lib/courses/fetch-course-session-progress";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** One-line role for course progress (Member vs Local leader vs staff). */
function progressRoleLabel(slugs: string[]): string {
  if (!slugs.length) return "—";
  const set = new Set(slugs);
  if (set.has("local_leader")) return "Local leader";
  if (set.has("member")) return "Member";
  if (set.has("super_admin")) return "Super admin";
  if (set.has("admin")) return "Administrator";
  return [...set]
    .sort()
    .map((s) =>
      s
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    )
    .join(", ");
}

export default async function ProgressPageContent({ courseId }: { courseId: string }) {
  if (!UUID_RE.test(courseId)) notFound();

  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access.</Typography>
      </Paper>
    );
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const isSuperAdmin = isSuperAdminUser(roleNames);
  const canLinkPersonProfile = isChapterStaffRole(roleNames);

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, applies_grades")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  if (!hasSupabaseAdminEnv()) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">
          This page needs the Supabase service role on the server. Set{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> and <code>NEXT_PUBLIC_SUPABASE_URL</code> in{" "}
          <code>.env.production</code>, then restart the app.
        </Typography>
      </Paper>
    );
  }

  const admin = createAdminClient();

  const { count: totalRegisteredUsers } = await admin
    .from("dashboard_users")
    .select("id", { count: "exact", head: true });

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
  const quizOnlySessionCount = sessionRows.filter((s) =>
    isQuizOnlySession(elementsBySession.get(s.id as string) ?? [])
  ).length;

  if (!totalSessions) {
    return (
      <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography>No sessions in this course.</Typography>
        <Link href={`/dashboard/courses/${courseId}/edit`}>Edit course</Link>
      </Paper>
    );
  }

  const progressRows = await fetchCourseSessionProgressForSessions(admin, sessionIds);

  const completionRow = await computeCourseCompletionRow(
    admin,
    { id: courseId, title: course.title as string },
    sessionIds,
    progressRows
  );

  const { data: quizEls } = await admin
    .from("course_elements")
    .select("id")
    .in("session_id", sessionIds)
    .eq("element_type", "quiz");

  const quizIds = (quizEls ?? []).map((e) => e.id as string);

  const byUser = new Map<string, { done: number; ids: Set<string> }>();
  for (const row of progressRows) {
    if (!countableSet.has(row.session_id)) continue;
    const uid = row.user_id;
    if (!byUser.has(uid)) byUser.set(uid, { done: 0, ids: new Set() });
    if (row.completed_at) {
      const u = byUser.get(uid)!;
      u.ids.add(row.session_id);
    }
  }
  for (const [, v] of byUser) v.done = v.ids.size;

  const quizByUser = new Map<string, { best: number; max: number }>();
  if (quizIds.length) {
    const results = await fetchCourseQuizResultsForElements(admin, quizIds);
    for (const r of results) {
      const uid = r.user_id;
      const score = Number(r.score);
      const max = Number(r.max_score);
      const cur = quizByUser.get(uid);
      if (!cur || score > cur.best) quizByUser.set(uid, { best: score, max });
    }
  }

  const userIds = [...byUser.keys()];
  const duById = new Map<
    string,
    {
      city: string | null;
      state: string | null;
      email: string;
      display_name: string | null;
      first_name: string | null;
      last_name: string | null;
      primary_chapter_id: string | null;
    }
  >();
  if (userIds.length) {
    const duRows = await listDashboardUsersByIds(admin, userIds);
    for (const u of duRows) {
      duById.set(u.id, {
        city: u.city,
        state: u.state,
        email: u.email,
        display_name: u.display_name,
        first_name: u.first_name,
        last_name: u.last_name,
        primary_chapter_id: u.primary_chapter_id ?? null,
      });
    }
  }

  const profileById = new Map<
    string,
    { avatar_url: string | null; city: string | null; state: string | null; primary_chapter_id: string | null }
  >();
  if (userIds.length) {
    const profileRows = await listProfilesByIds(admin, userIds);
    for (const p of profileRows) {
      profileById.set(p.id, {
        avatar_url: p.avatar_url ?? null,
        city: p.city,
        state: p.state,
        primary_chapter_id: p.primary_chapter_id ?? null,
      });
    }
  }

  const roleByUser = userIds.length ? await listRoleNamesByUserIds(admin, userIds) : new Map<string, string[]>();

  const { data: chapterRows } = await supabase
    .from("chapters")
    .select("id, name, city, state, zip_code, address_line")
    .order("name");
  const chapterOptions = (chapterRows ?? []) as Array<{
    id: string;
    name: string;
    city: string | null;
    state: string;
    zip_code: string | null;
    address_line: string | null;
  }>;

  const rows = userIds
    .map((uid) => {
      const du = duById.get(uid);
      const profile = profileById.get(uid);
      const name =
        du?.display_name?.trim() ||
        [du?.first_name, du?.last_name].filter(Boolean).join(" ").trim() ||
        du?.email ||
        uid;
      const slugs = roleByUser.get(uid) ?? [];
      const doneCount = byUser.get(uid)?.done ?? 0;
      return {
        uid,
        label: name,
        avatarUrl: profile?.avatar_url ?? null,
        city: preferNonEmptyAddr(profile?.city, du?.city),
        state: preferNonEmptyAddr(profile?.state, du?.state),
        primaryChapterId: profile?.primary_chapter_id ?? du?.primary_chapter_id ?? null,
        roleLabel: progressRoleLabel(slugs),
        roleBucket: progressRoleBucketFromSlugs(slugs),
        graduateBadge:
          totalSessions > 0 && doneCount >= totalSessions
            ? graduateBadgeRoleFromRoles(slugs)
            : null,
        showAdminCrown: slugs.includes("admin") || slugs.includes("super_admin"),
        done: doneCount,
        quiz: quizByUser.get(uid) ?? null,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <CourseProgressPageClient
      courseTitle={course.title as string}
      courseSlug={course.slug as string}
      courseId={courseId}
      rows={rows}
      chapterOptions={chapterOptions}
      totalSessions={totalSessions}
      quizOnlySessionCount={quizOnlySessionCount}
      quizCount={quizIds.length}
      appliesGrades={Boolean(course.applies_grades)}
      completionRow={completionRow}
      totalRegisteredUsers={totalRegisteredUsers ?? 0}
      totalWithProgress={userIds.length}
      isSuperAdmin={isSuperAdmin}
      linkToPersonProfile={canLinkPersonProfile}
    />
  );
}
