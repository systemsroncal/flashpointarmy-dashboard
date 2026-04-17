import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole } from "@/lib/auth/user-roles";

/** Member (no admin / super_admin / local_leader): restricted sidebar. */
export function isRestrictedMemberNav(roleNames: string[]): boolean {
  if (isElevatedRole(roleNames)) return false;
  if (roleNames.includes("local_leader")) return false;
  return roleNames.includes("member");
}

export function isLocalLeaderNonElevated(roleNames: string[]): boolean {
  return roleNames.includes("local_leader") && !isElevatedRole(roleNames);
}

const LOCAL_LEADER_HIDDEN_MODULES = new Set<string>([
  MODULE_SLUGS.community,
  MODULE_SLUGS.communications,
  MODULE_SLUGS.logs,
  MODULE_SLUGS.admins,
]);

/** Modules a pure member may see in the sidebar (plus permission checks). */
const MEMBER_NAV_MODULES = new Set<string>([
  MODULE_SLUGS.nationalOverview,
  MODULE_SLUGS.dashboard,
  MODULE_SLUGS.gatherings,
  MODULE_SLUGS.training,
  MODULE_SLUGS.communications,
  MODULE_SLUGS.growth,
]);

/**
 * Role-based nav visibility before `can(permissions, …, read)`.
 * Elevated users: no extra hiding here.
 */
export function isNavModuleAllowedForRoles(moduleSlug: string, roleNames: string[]): boolean {
  if (isElevatedRole(roleNames)) return true;
  if (isRestrictedMemberNav(roleNames)) {
    return MEMBER_NAV_MODULES.has(moduleSlug);
  }
  if (isLocalLeaderNonElevated(roleNames)) {
    return !LOCAL_LEADER_HIDDEN_MODULES.has(moduleSlug);
  }
  return true;
}
