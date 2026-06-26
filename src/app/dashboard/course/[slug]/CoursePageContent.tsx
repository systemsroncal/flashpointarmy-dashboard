import { CourseGridClient, type SessionCardModel } from "@/components/courses/CourseGridClient";
import { CourseIntroVideoBlock } from "@/components/dashboard/training/CourseIntroVideoBlock";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { isQuizOnlySession } from "@/lib/courses/session-counting";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { Box, Paper, Typography } from "@mui/material";

export default async function CoursePageContent({ slug }: { slug: string }) {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.training, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this course.</Typography>
      </Paper>
    );
  }

  const { data: course, error: cErr } = await supabase
    .from("courses")
    .select("id, title, slug, author_display_name")
    .eq("slug", slug)
    .maybeSingle();

  if (cErr || !course) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">Course not found.</Typography>
      </Paper>
    );
  }

  const { data: sessionsRaw } = await supabase
    .from("course_sessions")
    .select("id, slug, title, cover_image_url, sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const sessions = sessionsRaw ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const elementsBySession = new Map<string, { element_type: string }[]>();
  if (sessionIds.length) {
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
  }

  const completedIds = new Set<string>();
  if (sessionIds.length) {
    const { data: prog } = await supabase
      .from("course_session_progress")
      .select("session_id, completed_at")
      .eq("user_id", user.id)
      .in("session_id", sessionIds);
    for (const row of prog ?? []) {
      if (row.completed_at) completedIds.add(row.session_id as string);
    }
  }

  const sorted = [...sessions].sort((a, b) => a.sort_order - b.sort_order);
  const learnerSessions = sorted.filter((s) => !isQuizOnlySession(elementsBySession.get(s.id) ?? []));
  const cards: SessionCardModel[] = learnerSessions.map((s, idx) => {
    const prev = idx > 0 ? learnerSessions[idx - 1] : null;
    const locked = Boolean(prev && !completedIds.has(prev.id));
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      cover_image_url: s.cover_image_url,
      sort_order: s.sort_order,
      locked,
    };
  });

  const authorLabel = (course.author_display_name as string | null)?.trim() || "FlashPoint Team";
  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canEditCourse = isElevatedRole(roleNames);
  const editCourseHref = canEditCourse ? `/dashboard/courses/${course.id}/edit` : null;

  let courseIntroVideo: string | null = null;
  if (slug === BIBLICAL_CITIZENSHIP_COURSE_SLUG) {
    const envIntro = process.env.NEXT_PUBLIC_TRAINING_INTRO_VIDEO?.trim() ?? "";
    const { data: trainingRow } = await supabase
      .from("training_settings")
      .select("intro_video_url")
      .eq("id", 1)
      .maybeSingle();
    const dbIntro =
      trainingRow && typeof trainingRow.intro_video_url === "string"
        ? trainingRow.intro_video_url.trim()
        : "";
    courseIntroVideo = dbIntro || envIntro || null;
  }

  const isBiblicalCitizenship = slug === BIBLICAL_CITIZENSHIP_COURSE_SLUG;

  return (
    <Box
      sx={{
        minHeight: "60vh",
        py: 2,
        px: { xs: 0.5, sm: 1 },
        ...(isBiblicalCitizenship
          ? {}
          : {
              backgroundImage: `
          repeating-linear-gradient(105deg, transparent, transparent 14px, rgba(32,32,36,0.4) 14px, rgba(32,32,36,0.4) 28px),
          linear-gradient(180deg, #101012 0%, #070708 100%)
        `,
            }),
      }}
    >
      {courseIntroVideo ? <CourseIntroVideoBlock videoUrl={courseIntroVideo} /> : null}
      <CourseGridClient
        courseSlug={course.slug as string}
        courseTitle={course.title as string}
        authorLabel={authorLabel}
        sessions={cards}
        editCourseHref={editCourseHref}
        sectionTitle={isBiblicalCitizenship ? "Course Lessons" : undefined}
        sectionSubtitle={
          isBiblicalCitizenship
            ? "Complete all 8 lessons to unlock the next phase of your journey and continue serving through FlashPoint Army Chapters."
            : undefined
        }
        panelVariant={isBiblicalCitizenship ? "training" : "default"}
      />
    </Box>
  );
}
