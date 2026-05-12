/** Roles allowed to create Mobilize groups (product rule). */
export function canCreateMobilizeGroup(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "super_admin" || n === "admin" || n === "local_leader");
}
