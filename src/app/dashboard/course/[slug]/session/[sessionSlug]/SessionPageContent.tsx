import { CourseSessionPlayer, type SessionElementRow } from "@/components/courses/CourseSessionPlayer";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Paper, Typography } from "@mui/material";

export default async function SessionPageContent({
  courseSlug,
  sessionSlug,
}: {
  courseSlug: string;
  sessionSlug: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.training, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this session.</Typography>
      </Paper>
    );
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (!course) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">Course not found.</Typography>
      </Paper>
    );
  }

  const { data: sessionsRaw } = await supabase
    .from("course_sessions")
    .select("id, slug, title, subtitle, cover_image_url, sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const sessions = sessionsRaw ?? [];
  const idx = sessions.findIndex((s) => s.slug === sessionSlug);
  if (idx < 0) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">Session not found.</Typography>
      </Paper>
    );
  }

  const current = sessions[idx];
  const prev = idx > 0 ? sessions[idx - 1] : null;
  const next = idx < sessions.length - 1 ? sessions[idx + 1] : null;

  const sessionIds = sessions.map((s) => s.id);
  const { data: progRows } = await supabase
    .from("course_session_progress")
    .select("session_id, completed_at, video_positions")
    .eq("user_id", user.id)
    .in("session_id", sessionIds);

  const progBySession = new Map<string, { completed_at: string | null; video_positions: Record<string, number> }>();
  for (const row of progRows ?? []) {
    const vp = row.video_positions;
    progBySession.set(row.session_id as string, {
      completed_at: (row.completed_at as string | null) ?? null,
      video_positions:
        typeof vp === "object" && vp && !Array.isArray(vp) ? (vp as Record<string, number>) : {},
    });
  }

  const prevSlug = prev?.slug ?? null;
  const nextSlug = next?.slug ?? null;

  const prevDone = !prev || Boolean(progBySession.get(prev.id)?.completed_at);
  if (!prevDone) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="warning.main">
          Complete the previous session to access this one.
        </Typography>
      </Paper>
    );
  }

  const currentProg = progBySession.get(current.id);
  const completed = Boolean(currentProg?.completed_at);
  const nextLocked = Boolean(nextSlug) && !completed;

  const { data: elements } = await supabase
    .from("course_elements")
    .select("id, element_type, title_html, description_html, payload, sort_order")
    .eq("session_id", current.id)
    .order("sort_order", { ascending: true });

  const elementRows: SessionElementRow[] = (elements ?? []) as SessionElementRow[];
  const quizIds = elementRows.filter((e) => e.element_type === "quiz").map((e) => e.id);

  const quizScores: Record<string, { score: number; maxScore: number }> = {};
  if (quizIds.length) {
    const { data: qres } = await supabase
      .from("course_quiz_results")
      .select("element_id, score, max_score")
      .eq("user_id", user.id)
      .in("element_id", quizIds);
    for (const r of qres ?? []) {
      quizScores[r.element_id as string] = {
        score: Number(r.score),
        maxScore: Number(r.max_score),
      };
    }
  }

  return (
    <CourseSessionPlayer
      courseSlug={course.slug as string}
      sessionId={current.id}
      sessionSlug={current.slug as string}
      sessionTitle={current.title as string}
      sessionSubtitle={(current.subtitle as string | null) ?? null}
      coverImageUrl={(current.cover_image_url as string | null) ?? null}
      elements={elementRows}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      nextLocked={nextLocked}
      initialCompleted={completed}
      initialVideoPositions={currentProg?.video_positions ?? {}}
      quizScores={quizScores}
    />
  );
}
