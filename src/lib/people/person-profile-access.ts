import { MODULE_SLUGS } from "@/config/modules";
import { isChapterStaffRole, isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Person profile pages are admin-staff only:
 * super_admin, admin, and sub_admin.
 */
export async function canViewPersonProfile(
  supabase: SupabaseClient,
  viewerId: string,
  targetRoleNames: string[]
): Promise<boolean> {
  const [permissions, viewerRoles] = await Promise.all([
    loadModulePermissions(supabase, viewerId),
    loadUserRoleNames(supabase, viewerId),
  ]);

  if (!isChapterStaffRole(viewerRoles)) return false;

  const targetIsAdminDir =
    targetRoleNames.includes("admin") ||
    targetRoleNames.includes("super_admin") ||
    targetRoleNames.includes("sub_admin");

  if (targetIsAdminDir) {
    return can(permissions, MODULE_SLUGS.admins, "read");
  }

  return (
    can(permissions, MODULE_SLUGS.community, "read") ||
    can(permissions, MODULE_SLUGS.leaders, "read")
  );
}

export async function canEditPersonProfile(
  supabase: SupabaseClient,
  viewerId: string,
  targetRoleNames: string[]
): Promise<boolean> {
  const [permissions, viewerRoles] = await Promise.all([
    loadModulePermissions(supabase, viewerId),
    loadUserRoleNames(supabase, viewerId),
  ]);

  if (!isChapterStaffRole(viewerRoles)) return false;

  const targetIsAdminDir =
    targetRoleNames.includes("admin") ||
    targetRoleNames.includes("super_admin") ||
    targetRoleNames.includes("sub_admin");

  if (targetIsAdminDir) {
    return can(permissions, MODULE_SLUGS.admins, "update") && isElevatedRole(viewerRoles);
  }

  return (
    can(permissions, MODULE_SLUGS.community, "update") ||
    can(permissions, MODULE_SLUGS.leaders, "update")
  );
}
