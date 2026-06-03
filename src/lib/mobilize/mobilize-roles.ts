import type { SupabaseClient } from "@supabase/supabase-js";
import { listAdminDashboardUserIds, listUserIdsByRoleNames } from "@/lib/admin/dashboard-user-queries";

export type MobilizeGroupCreatorPolicy = {
  allowMember: boolean;
  allowLocalLeader: boolean;
};

export const DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY: MobilizeGroupCreatorPolicy = {
  allowMember: false,
  allowLocalLeader: true,
};

export async function loadMobilizeGroupCreatorPolicy(
  admin: SupabaseClient
): Promise<MobilizeGroupCreatorPolicy> {
  const { data, error } = await admin
    .from("mobilize_policy_settings")
    .select("allow_member_group_create, allow_local_leader_group_create")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY;
  }
  const row = data as {
    allow_member_group_create?: boolean | null;
    allow_local_leader_group_create?: boolean | null;
  };
  return {
    allowMember: row.allow_member_group_create === true,
    allowLocalLeader: row.allow_local_leader_group_create !== false,
  };
}

/** Admins always can; members / local leaders depend on `mobilize_policy_settings`. */
export function canCreateMobilizeGroup(
  roleNames: string[],
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY
): boolean {
  if (roleNames.some((n) => n === "super_admin" || n === "admin" || n === "sub_admin")) return true;
  if (policy.allowLocalLeader && roleNames.includes("local_leader")) return true;
  if (policy.allowMember && roleNames.includes("member")) return true;
  return false;
}

const ADMIN_OWNER_ROLES = ["admin", "super_admin", "sub_admin"] as const;

/** Role slugs eligible as group owner per Mobilize settings (+ all admins). */
export function mobilizeOwnerCandidateRoleNames(
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY
): string[] {
  const names = new Set<string>([...ADMIN_OWNER_ROLES]);
  if (policy.allowLocalLeader) names.add("local_leader");
  if (policy.allowMember) names.add("member");
  return [...names];
}

export async function listMobilizeOwnerCandidateUserIds(
  admin: SupabaseClient,
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY,
  extraUserIds: string[] = []
): Promise<string[]> {
  const userIds = new Set<string>(extraUserIds.filter(Boolean));

  // Admins always eligible, regardless of Mobilize member/leader toggles.
  for (const id of await listAdminDashboardUserIds(admin)) {
    userIds.add(id);
  }

  const policyOnlyRoles = mobilizeOwnerCandidateRoleNames(policy).filter(
    (n) => !(ADMIN_OWNER_ROLES as readonly string[]).includes(n)
  );
  if (policyOnlyRoles.length > 0) {
    for (const id of await listUserIdsByRoleNames(admin, policyOnlyRoles)) {
      userIds.add(id);
    }
  }

  return [...userIds];
}
