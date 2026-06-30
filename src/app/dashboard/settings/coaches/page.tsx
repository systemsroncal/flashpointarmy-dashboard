import { CoachesSettingsClient } from "@/components/dashboard/settings/CoachesSettingsClient";
import { DataPaneFallback } from "@/components/dashboard/DataPaneFallback";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import { requireServerUser } from "@/lib/auth/server-session";
import { Paper, Typography } from "@mui/material";
import { Suspense } from "react";

async function CoachesSettingsInner() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roleNames)) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this page.</Typography>
      </Paper>
    );
  }
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">You do not have access to this page.</Typography>
      </Paper>
    );
  }
  return <CoachesSettingsClient />;
}

export default function CoachesSettingsPage() {
  return (
    <Suspense fallback={<DataPaneFallback label="Loading coaches settings" />}>
      <CoachesSettingsInner />
    </Suspense>
  );
}
