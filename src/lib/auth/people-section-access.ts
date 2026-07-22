import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isLocalLeaderNonElevated,
  isNavModuleAllowedForRoles,
  isRestrictedMemberNav,
} from "@/lib/auth/nav-access";
import { isChapterStaffRole, isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can, type ModulePermissionMap } from "@/types/permissions";

/** Local leaders and members must not use dashboard People routes (overview, leaders, members). */
export function isDashboardPeopleSectionBlocked(roleNames: string[]): boolean {
  if (isElevatedRole(roleNames) || roleNames.includes("sub_admin")) return false;
  return isLocalLeaderNonElevated(roleNames) || isRestrictedMemberNav(roleNames);
}

export function canAccessPeopleOverview(
  roleNames: string[],
  permissions: ModulePermissionMap
): boolean {
  if (isDashboardPeopleSectionBlocked(roleNames)) return false;
  if (!isChapterStaffRole(roleNames)) return false;
  if (
    !isNavModuleAllowedForRoles(MODULE_SLUGS.community, roleNames) &&
    !isNavModuleAllowedForRoles(MODULE_SLUGS.leaders, roleNames)
  ) {
    return false;
  }
  return (
    can(permissions, MODULE_SLUGS.community, "read") ||
    can(permissions, MODULE_SLUGS.leaders, "read")
  );
}

export function canAccessPeopleLeaders(
  roleNames: string[],
  permissions: ModulePermissionMap
): boolean {
  if (isDashboardPeopleSectionBlocked(roleNames)) return false;
  if (!isNavModuleAllowedForRoles(MODULE_SLUGS.leaders, roleNames)) return false;
  return can(permissions, MODULE_SLUGS.leaders, "read");
}

export function canAccessPeopleMembers(
  roleNames: string[],
  permissions: ModulePermissionMap
): boolean {
  if (isDashboardPeopleSectionBlocked(roleNames)) return false;
  if (!isNavModuleAllowedForRoles(MODULE_SLUGS.community, roleNames)) return false;
  return can(permissions, MODULE_SLUGS.community, "read");
}

export async function loadDashboardPeopleAccess(supabase: SupabaseClient, userId: string) {
  const [permissions, roleNames] = await Promise.all([
    loadModulePermissions(supabase, userId),
    loadUserRoleNames(supabase, userId),
  ]);
  return {
    roleNames,
    permissions,
    overview: canAccessPeopleOverview(roleNames, permissions),
    leaders: canAccessPeopleLeaders(roleNames, permissions),
    members: canAccessPeopleMembers(roleNames, permissions),
  };
}
