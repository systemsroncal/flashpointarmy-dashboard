import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProgressPageContent({ courseId }: { courseId: string }) {
  if (!UUID_RE.test(courseId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
  let labels = new Map<string, string>();
  if (userIds.length) {
    const { data: du } = await admin
      .from("dashboard_users")
      .select("id, email, display_name, first_name, last_name")
      .in("id", userIds);
    for (const u of du ?? []) {
      const name =
        (u.display_name as string)?.trim() ||
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        (u.email as string);
      labels.set(u.id as string, name);
    }
  }

  const rows = userIds
    .map((uid) => ({
      uid,
      label: labels.get(uid) ?? uid,
      done: byUser.get(uid)?.done ?? 0,
      quiz: quizByUser.get(uid) ?? null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Progress — {course.title as string}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Public URL: /dashboard/course/{course.slug as string}
      </Typography>
      <Paper sx={{ bgcolor: "rgba(0,0,0,0.45)", overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell align="right">Sessions completed</TableCell>
              <TableCell align="right">Quiz (best attempt)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary">No progress recorded yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.uid}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell align="right">
                    {r.done} / {totalSessions}
                  </TableCell>
                  <TableCell align="right">
                    {quizIds.length === 0
                      ? "—"
                      : r.quiz
                        ? `${r.quiz.best} / ${r.quiz.max}`
                        : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      {Boolean(course.applies_grades) ? null : (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          This course has grades disabled; quiz scores are still listed per attempt when quizzes exist.
        </Typography>
      )}
    </Box>
  );
}
