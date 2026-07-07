export const MOBILIZE_DELETE_CONFIRM_WORD = "delete";

export function isMobilizeSuperAdmin(roleNames: string[]): boolean {
  return roleNames.includes("super_admin");
}

/** Super admins bypass membership gates for read/moderation. */
export function canViewMobilizeGroupMemberContent(input: {
  roleNames: string[];
  isApprovedMember: boolean;
}): boolean {
  return input.isApprovedMember || isMobilizeSuperAdmin(input.roleNames);
}

/** Leaders, super admins, and content authors may edit or delete published chapter content. */
export function canManageMobilizeGroupContent(input: {
  roleNames: string[];
  isLeader?: boolean;
  isAuthor?: boolean;
}): boolean {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;
  if (input.isLeader) return true;
  if (input.isAuthor) return true;
  return false;
}
