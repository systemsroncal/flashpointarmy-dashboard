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

/** Leaders, admins, super admins, and content authors may edit or delete published chapter content. */
export function canManageMobilizeGroupContent(input: {
  roleNames: string[];
  isLeader?: boolean;
  isAuthor?: boolean;
}): boolean {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;
  if (input.roleNames.includes("admin")) return true;
  if (input.isLeader) return true;
  if (input.isAuthor) return true;
  return false;
}

/** Pin/unpin group feed posts — leaders, admins, and super admins only. */
export function canPinMobilizeGroupMessage(input: {
  roleNames: string[];
  isLeader?: boolean;
}): boolean {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;
  if (input.roleNames.includes("admin")) return true;
  if (input.isLeader) return true;
  return false;
}

/**
 * Group leaders, group owner, chapter owner, site staff (admin/super_admin) may add
 * or remove members directly without an approval round-trip. `isLeader` and
 * `isChapterOwner` flags are precomputed by the caller from mobilize_group_members
 * and mobilize_groups rows.
 */
export function canManageMobilizeGroupMembers(input: {
  roleNames: string[];
  isLeader?: boolean;
  isGroupOwner?: boolean;
  isChapterOwner?: boolean;
}): boolean {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;
  if (input.roleNames.includes("admin")) return true;
  if (input.isLeader) return true;
  if (input.isGroupOwner) return true;
  if (input.isChapterOwner) return true;
  return false;
}

/**
 * Promote a member to leader (or demote one) — super admins, site admins, and
 * the group owner only. Leaders may approve and remove members, but appointing
 * other leaders stays with owners and staff.
 */
export function canChangeMobilizeGroupMemberRole(input: {
  roleNames: string[];
  isGroupOwner?: boolean;
}): boolean {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;
  if (input.roleNames.includes("admin")) return true;
  if (input.isGroupOwner) return true;
  return false;
}
