import { CommunicationsNavTabs } from "@/components/dashboard/communications/CommunicationsNavTabs";
import { NotificationsAppClient } from "@/components/dashboard/notifications/NotificationsAppClient";
import { isElevatedRole, isSubAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { Box } from "@mui/material";

export default async function NotificationsPageContent() {
  const { supabase, user } = await requireServerUser();

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canManage = roleNames.includes("admin") || roleNames.includes("super_admin");
  const showBroadcastNav = isElevatedRole(roleNames) || isSubAdminUser(roleNames);

  return (
    <Box>
      {showBroadcastNav && <CommunicationsNavTabs />}
      <NotificationsAppClient canManage={canManage} />
    </Box>
  );
}
