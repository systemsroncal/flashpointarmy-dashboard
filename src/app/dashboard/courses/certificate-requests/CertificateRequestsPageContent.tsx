import { CertificateRequestsAdminClient } from "@/components/dashboard/courses/CertificateRequestsAdminClient";
import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import type { ChapterSearchRow } from "@/lib/chapters/chapter-search";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { Paper, Typography } from "@mui/material";

export default async function CertificateRequestsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);
  const elevated = isElevatedRole(roleNames);

  if (!elevated || !can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to certificate requests.</Typography>
      </Paper>
    );
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, city, state")
    .order("name");

  const chapterOptions: ChapterSearchRow[] = (chapters ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    city: (c.city as string | null) ?? null,
    state: String(c.state ?? "").trim(),
  }));

  return (
    <CertificateRequestsAdminClient
      chapterOptions={chapterOptions}
      courseSlug={BIBLICAL_CITIZENSHIP_COURSE_SLUG}
    />
  );
}
