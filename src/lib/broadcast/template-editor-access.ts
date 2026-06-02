import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireServerUser } from "@/lib/auth/server-session";
import { can } from "@/types/permissions";

export async function loadBroadcastTemplateEditorAccess() {
  const { supabase, user } = await requireServerUser();
  const permissions = await loadModulePermissions(supabase, user.id);
  const roleNames = await loadUserRoleNames(supabase, user.id);

  const canRead =
    can(permissions, MODULE_SLUGS.communications, "read") || isElevatedRole(roleNames);
  const canManage =
    isElevatedRole(roleNames) || can(permissions, MODULE_SLUGS.communications, "create");

  return { canRead, canManage };
}
