import { PeopleOverviewClient } from "@/components/dashboard/people/PeopleOverviewClient";
import { canAccessPeopleOverview } from "@/lib/auth/people-section-access";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadPeopleOverviewStats } from "@/lib/people/people-overview-stats";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { Paper, Typography } from "@mui/material";

export default async function PeoplePageContent() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roles = await loadUserRoleNames(supabase, user.id);

  if (!canAccessPeopleOverview(roles, permissions)) {
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
