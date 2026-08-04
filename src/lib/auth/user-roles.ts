import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadUserRoleNames(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles ( name )")
    .eq("user_id", userId);

  if (error || !data) return [];

  const names: string[] = [];
  for (const row of data as unknown as { roles: { name: string } | null }[]) {
    const n = row.roles?.name;
    if (n) names.push(n);
  }
  return names;
}

export const SUB_ADMIN_ROLE = "sub_admin";

export function isElevatedRole(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "super_admin" || n === "admin");
}

/** Mobilize pages, APIs, and navigation actions — super_admin, or roles listed in settings. */
export function canAccessMobilizeModule(
  roleNames: string[],
  chaptersViewerRoles: readonly string[] = []
): boolean {
  if (roleNames.includes("super_admin")) return true;
  return chaptersViewerRoles.some((r) => roleNames.includes(r));
}

/** Chapters (Mobilize) sidebar label — visible when the user can open the module, or to platform admins. */
export function canSeeMobilizeNavItem(
  roleNames: string[],
  chaptersViewerRoles: readonly string[] = []
): boolean {
  if (canAccessMobilizeModule(roleNames, chaptersViewerRoles)) return true;
  return isAdminButNotSuper(roleNames);
}

export function isSubAdminUser(roleNames: string[]): boolean {
  return roleNames.includes(SUB_ADMIN_ROLE);
}

/** Chapters, community, leaders, gatherings — admin, sub admin, or super admin. */
export function isChapterStaffRole(roleNames: string[]): boolean {
  return isElevatedRole(roleNames) || isSubAdminUser(roleNames);
}

/** Platform owner */
export function isSuperAdminUser(roleNames: string[]): boolean {
  return roleNames.includes("super_admin");
}

/** Has `admin` but not `super_admin` — dashboard admin with peer restrictions */
export function isAdminButNotSuper(roleNames: string[]): boolean {
  return roleNames.includes("admin") && !roleNames.includes("super_admin");
}

export function isMemberOrLeader(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "member" || n === "local_leader");
}
