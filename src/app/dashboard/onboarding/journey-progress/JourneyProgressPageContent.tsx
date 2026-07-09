import { JourneyProgressAdminClient } from "@/components/dashboard/onboarding/JourneyProgressAdminClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { loadJourneyProgressBundle } from "@/lib/onboarding/journey-progress-stats";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { Paper, Typography } from "@mui/material";

export default async function JourneyProgressPageContent() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roles = await loadUserRoleNames(supabase, user.id);

  if (!isElevatedRole(roles) || !can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to Journey progress.</Typography>
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
  const { rows, stats } = await loadJourneyProgressBundle(admin);

  return <JourneyProgressAdminClient initialRows={rows} initialStats={stats} />;
}
