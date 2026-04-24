import { CourseEditClient } from "@/components/dashboard/courses/CourseEditClient";
import { labelForAuthor, type AuthorOption } from "@/lib/courses/author-options";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Paper, Typography } from "@mui/material";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditCoursePageContent({ courseId }: { courseId: string }) {
  if (!UUID_RE.test(courseId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "update")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have permission to edit courses.</Typography>
      </Paper>
    );
  }

  const { data: course, error: cErr } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (cErr || !course) notFound();

  const { data: sessionsRaw } = await supabase
    .from("course_sessions")
    .select("id, slug, title, subtitle, cover_image_url, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const sessions = sessionsRaw ?? [];
  const sessionIds = sessions.map((s) => s.id);

  let elementsBySession = new Map<string, unknown[]>();
  if (sessionIds.length) {
    const { data: els } = await supabase
      .from("course_elements")
      .select("id, session_id, element_type, title_html, description_html, payload, sort_order")
      .in("session_id", sessionIds)
      .order("sort_order", { ascending: true });
    for (const e of els ?? []) {
      const sid = e.session_id as string;
      const list = elementsBySession.get(sid) ?? [];
      list.push(e);
      elementsBySession.set(sid, list);
    }
  }

  const initialSessions = sessions.map((s) => {
    const rawEls = (elementsBySession.get(s.id as string) ?? []) as Array<Record<string, unknown>>;
    const sortedEls = [...rawEls].sort(
      (a, b) => (a.sort_order as number) - (b.sort_order as number)
    );
    return {
      id: s.id as string,
      slug: s.slug as string,
      title: s.title as string,
      subtitle: (s.subtitle as string) ?? "",
      cover_image_url: (s.cover_image_url as string) ?? "",
      sort_order: s.sort_order as number,
      elements: sortedEls.map((row) => ({
        id: row.id as string,
        element_type: row.element_type as string,
        title_html: (row.title_html as string) ?? "",
        description_html: (row.description_html as string) ?? "",
        payload: row.payload,
        sort_order: row.sort_order as number,
      })),
    };
  });

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("dashboard_users")
    .select("id, email, display_name, first_name, last_name")
    .order("email", { ascending: true })
    .limit(800);

  const authorOptions: AuthorOption[] = (users ?? []).map((u) => ({
    id: u.id as string,
    label: labelForAuthor({
      id: u.id as string,
      display_name: u.display_name as string | null,
      first_name: u.first_name as string | null,
      last_name: u.last_name as string | null,
      email: u.email as string | null,
    }),
  }));

  return (
    <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
      <CourseEditClient
        courseId={courseId}
        initialCourse={{
          title: course.title as string,
          slug: course.slug as string,
          subtitle: (course.subtitle as string | null) ?? null,
          published: Boolean(course.published),
          applies_grades: Boolean(course.applies_grades),
          author_user_id: (course.author_user_id as string | null) ?? null,
          author_display_name: (course.author_display_name as string | null) ?? null,
        }}
        initialSessions={initialSessions}
        authorOptions={authorOptions}
      />
    </Paper>
  );
}
