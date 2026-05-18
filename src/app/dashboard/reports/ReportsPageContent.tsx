import { ReportsChartsClient } from "@/components/dashboard/reports/ReportsChartsClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { Paper, Typography } from "@mui/material";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function ReportsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.reports, "read")) {
    return (
      <Paper sx={{ p: 3, bgcolor: "rgba(0,0,0,0.45)" }}>
        <Typography color="error">
          You do not have access to Reports. Administrators need the Reports module enabled (migration 033).
        </Typography>
      </Paper>
    );
  }

  return <ReportsChartsClient />;
}
