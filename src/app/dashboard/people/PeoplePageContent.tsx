import { PeopleOverviewClient } from "@/components/dashboard/people/PeopleOverviewClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isNavModuleAllowedForRoles } from "@/lib/auth/nav-access";
import { isChapterStaffRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { loadPeopleOverviewStats } from "@/lib/people/people-overview-stats";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { Paper, Typography } from "@mui/material";

export default async function PeoplePageContent() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roles = await loadUserRoleNames(supabase, user.id);

  const canPeople =
    isChapterStaffRole(roles) &&
    (can(permissions, MODULE_SLUGS.community, "read") ||
      can(permissions, MODULE_SLUGS.leaders, "read")) &&
    (isNavModuleAllowedForRoles(MODULE_SLUGS.community, roles) ||
      isNavModuleAllowedForRoles(MODULE_SLUGS.leaders, roles));

  if (!canPeople) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to People overview.</Typography>
      </Paper>
    );
  }

  if (!hasSupabaseAdminEnv()) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">Admin client is not configured.</Typography>
      </Paper>
    );
  }

  const admin = createAdminClient();
  const stats = await loadPeopleOverviewStats(admin);
  return <PeopleOverviewClient stats={stats} />;
}
