import { NewCourseForm } from "@/components/dashboard/courses/NewCourseForm";
import { labelForAuthor, type AuthorOption } from "@/lib/courses/author-options";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Paper, Typography } from "@mui/material";

export default async function NewCoursePageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "create")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have permission to create courses.</Typography>
      </Paper>
    );
  }

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

  return <NewCourseForm authorOptions={authorOptions} />;
}
