import { BroadcastTemplatesClient } from "@/components/dashboard/communications/BroadcastTemplatesClient";
import { CommunicationsNavTabs } from "@/components/dashboard/communications/CommunicationsNavTabs";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { can } from "@/types/permissions";
import { Box, Typography } from "@mui/material";

export default async function BroadcastTemplatesPageContent() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);

  const canRead =
    can(permissions, MODULE_SLUGS.communications, "read") || isElevatedRole(roleNames);
  if (!canRead) {
    return (
      <Box>
        <Typography color="error">You do not have access to broadcast templates.</Typography>
      </Box>
    );
  }

  const canManage =
    can(permissions, MODULE_SLUGS.communications, "create") && isElevatedRole(roleNames);

  return (
    <Box>
      <CommunicationsNavTabs />
      <BroadcastTemplatesClient canManage={canManage} />
    </Box>
  );
}
