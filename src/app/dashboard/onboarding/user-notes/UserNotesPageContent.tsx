import { UserNotesAdminClient } from "@/components/dashboard/onboarding/UserNotesAdminClient";
import { MODULE_SLUGS } from "@/config/modules";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { can } from "@/types/permissions";
import { Paper, Typography } from "@mui/material";

export default async function UserNotesPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);

  if (!isChapterStaffRole(roleNames) || !can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to user notes.</Typography>
      </Paper>
    );
  }

  return <UserNotesAdminClient />;
}
