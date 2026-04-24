import { CourseGridClient, type SessionCardModel } from "@/components/courses/CourseGridClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Box, Paper, Typography } from "@mui/material";

export default async function CoursePageContent({ slug }: { slug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  let completedIds = new Set<string>();
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
  const cards: SessionCardModel[] = sorted.map((s, idx) => {
    const prev = idx > 0 ? sorted[idx - 1] : null;
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

  return (
    <Box
      sx={{
        minHeight: "60vh",
        py: 2,
        px: { xs: 0.5, sm: 1 },
        backgroundImage: `
          repeating-linear-gradient(105deg, transparent, transparent 14px, rgba(32,32,36,0.4) 14px, rgba(32,32,36,0.4) 28px),
          linear-gradient(180deg, #101012 0%, #070708 100%)
        `,
      }}
    >
      <CourseGridClient
        courseSlug={course.slug as string}
        courseTitle={course.title as string}
        authorLabel={authorLabel}
        sessions={cards}
      />
    </Box>
  );
}
