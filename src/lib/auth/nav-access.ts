import { MODULE_SLUGS } from "@/config/modules";
import { isElevatedRole, isSubAdminUser } from "@/lib/auth/user-roles";

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
  MODULE_SLUGS.chapters,
  MODULE_SLUGS.logs,
  MODULE_SLUGS.admins,
  MODULE_SLUGS.courses,
  MODULE_SLUGS.movilization,
]);

/** Sub admin: operational modules only (no Mobilize, no Settings). */
const SUB_ADMIN_NAV_MODULES = new Set<string>([
  MODULE_SLUGS.nationalOverview,
  MODULE_SLUGS.dashboard,
  MODULE_SLUGS.chapters,
  MODULE_SLUGS.leaders,
  MODULE_SLUGS.community,
  MODULE_SLUGS.gatherings,
  MODULE_SLUGS.training,
  MODULE_SLUGS.communications,
]);

/** Modules a pure member may see in the sidebar (plus permission checks). */
const MEMBER_NAV_MODULES = new Set<string>([
  MODULE_SLUGS.nationalOverview,
  MODULE_SLUGS.dashboard,
  MODULE_SLUGS.gatherings,
  MODULE_SLUGS.training,
  MODULE_SLUGS.communications,
]);

/**
 * Chapters admin directory — not for member / local leader accounts.
 */
function isChaptersNavHiddenForRoles(roleNames: string[]): boolean {
  if (isElevatedRole(roleNames) || isSubAdminUser(roleNames)) return false;
  return roleNames.includes("member") || roleNames.includes("local_leader");
}

/**
 * Role-based nav visibility before `can(permissions, …, read)`.
 * Elevated users: no extra hiding here.
 */
export function isNavModuleAllowedForRoles(moduleSlug: string, roleNames: string[]): boolean {
  if (isElevatedRole(roleNames)) return true;
  if (moduleSlug === MODULE_SLUGS.chapters && isChaptersNavHiddenForRoles(roleNames)) {
    return false;
  }
  if (isSubAdminUser(roleNames)) {
    return SUB_ADMIN_NAV_MODULES.has(moduleSlug);
  }
  if (isRestrictedMemberNav(roleNames)) {
    return MEMBER_NAV_MODULES.has(moduleSlug);
  }
  if (isLocalLeaderNonElevated(roleNames)) {
    return !LOCAL_LEADER_HIDDEN_MODULES.has(moduleSlug);
  }
  return true;
}
