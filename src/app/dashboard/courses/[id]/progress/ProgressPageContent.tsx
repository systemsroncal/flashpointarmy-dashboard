import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { requireServerUser } from "@/lib/auth/server-session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Box, Paper, Typography } from "@mui/material";
import { CourseProgressUsersTable } from "@/components/dashboard/courses/CourseProgressUsersTable";
import { listDashboardUsersByIds, listRoleNamesByUserIds } from "@/lib/admin/dashboard-user-queries";

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

  const { data: course } = await supabase.from("courses").select("id, title, slug, applies_grades").eq("id", courseId).maybeSingle();
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
  const { data: sessions } = await admin.from("course_sessions").select("id").eq("course_id", courseId);
  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  const totalSessions = sessionIds.length;

  if (!totalSessions) {
    return (
      <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography>No sessions in this course.</Typography>
        <Link href={`/dashboard/courses/${courseId}/edit`}>Edit course</Link>
      </Paper>
    );
  }

  const { data: prog } = await admin
    .from("course_session_progress")
    .select("user_id, session_id, completed_at")
    .in("session_id", sessionIds);

  const { data: quizEls } = await admin
    .from("course_elements")
    .select("id")
    .in("session_id", sessionIds)
    .eq("element_type", "quiz");

  const quizIds = (quizEls ?? []).map((e) => e.id as string);

  const byUser = new Map<string, { done: number; ids: Set<string> }>();
  for (const row of prog ?? []) {
    const uid = row.user_id as string;
    if (!byUser.has(uid)) byUser.set(uid, { done: 0, ids: new Set() });
    if (row.completed_at) {
      const u = byUser.get(uid)!;
      u.ids.add(row.session_id as string);
    }
  }
  for (const [, v] of byUser) v.done = v.ids.size;

  const quizByUser = new Map<string, { best: number; max: number }>();
  if (quizIds.length) {
    const { data: results } = await admin
      .from("course_quiz_results")
      .select("user_id, score, max_score")
      .in("element_id", quizIds);
    for (const r of results ?? []) {
      const uid = r.user_id as string;
      const score = Number(r.score);
      const max = Number(r.max_score);
      const cur = quizByUser.get(uid);
      if (!cur || score > cur.best) quizByUser.set(uid, { best: score, max });
    }
  }

  const userIds = [...byUser.keys()];
  const duById = new Map<string, { city: string | null; state: string | null; email: string; display_name: string | null; first_name: string | null; last_name: string | null }>();
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
      });
    }
  }

  const roleByUser = userIds.length ? await listRoleNamesByUserIds(admin, userIds) : new Map<string, string[]>();

  const rows = userIds
    .map((uid) => {
      const du = duById.get(uid);
      const name =
        du?.display_name?.trim() ||
        [du?.first_name, du?.last_name].filter(Boolean).join(" ").trim() ||
        du?.email ||
        uid;
      return {
        uid,
        label: name,
        city: du?.city?.trim() || null,
        state: du?.state?.trim() || null,
        roleLabel: progressRoleLabel(roleByUser.get(uid) ?? []),
        done: byUser.get(uid)?.done ?? 0,
        quiz: quizByUser.get(uid) ?? null,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Progress — {course.title as string}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Public URL: /dashboard/course/{course.slug as string}
      </Typography>
      <CourseProgressUsersTable rows={rows} totalSessions={totalSessions} quizCount={quizIds.length} />
      {Boolean(course.applies_grades) ? null : (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          This course has grades disabled; quiz scores are still listed per attempt when quizzes exist.
        </Typography>
      )}
    </Box>
  );
}
