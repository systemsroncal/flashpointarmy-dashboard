import type { SupabaseClient } from "@supabase/supabase-js";
import { listAdminDashboardUserIds, listUserIdsByRoleNames } from "@/lib/admin/dashboard-user-queries";
import { normalizeGroupCreatorRoles } from "@/lib/auth/dashboard-user";
import { isChapterStaffRole } from "@/lib/auth/user-roles";

export type MobilizeGroupCreatorPolicy = {
  /** @deprecated kept for legacy callers */
  allowMember: boolean;
  /** True when any local leader (verified or not) may create groups. */
  allowLocalLeader: boolean;
  /** True when only/also verified local leaders may create groups. */
  allowVerifiedLocalLeader: boolean;
  /** Roles: local_leader | verified_local_leader */
  creatorRoles: string[];
};

export const DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY: MobilizeGroupCreatorPolicy = {
  allowMember: false,
  allowLocalLeader: true,
  allowVerifiedLocalLeader: false,
  creatorRoles: ["local_leader"],
};

function policyFromCreatorRoles(roles: string[]): MobilizeGroupCreatorPolicy {
  return {
    creatorRoles: roles,
    allowLocalLeader: roles.includes("local_leader"),
    allowVerifiedLocalLeader: roles.includes("verified_local_leader"),
    allowMember: false,
  };
}

export async function loadMobilizeGroupCreatorPolicy(
  admin: SupabaseClient
): Promise<MobilizeGroupCreatorPolicy> {
  const { data, error } = await admin
    .from("mobilize_policy_settings")
    .select(
      "allow_member_group_create, allow_local_leader_group_create, group_creator_roles"
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY;
  }
  const row = data as {
    allow_member_group_create?: boolean | null;
    allow_local_leader_group_create?: boolean | null;
    group_creator_roles?: unknown;
  };
  const fromColumn = normalizeGroupCreatorRoles(row.group_creator_roles);
  if (fromColumn.length > 0) {
    return policyFromCreatorRoles(fromColumn);
  }
  // Legacy boolean fallback (pre-group_creator_roles / pre-verified).
  const roles: string[] = [];
  if (row.allow_local_leader_group_create !== false) roles.push("local_leader");
  return policyFromCreatorRoles(roles.length ? roles : ["local_leader"]);
}

export async function loadLocalLeaderVerified(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("profiles")
    .select("local_leader_verified")
    .eq("id", userId)
    .maybeSingle();
  return Boolean((data as { local_leader_verified?: boolean } | null)?.local_leader_verified);
}

export type CanCreateMobilizeGroupOptions = {
  /** Creating a Mobilize chapter (top-level). Local leaders cannot. */
  creatingChapter?: boolean;
  localLeaderVerified?: boolean;
};

/**
 * Chapters: only admin / sub_admin / super_admin.
 * Groups: staff always; local leaders per settings (all LL and/or verified LL).
 */
export function canCreateMobilizeGroup(
  roleNames: string[],
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY,
  options: CanCreateMobilizeGroupOptions = {}
): boolean {
  if (roleNames.includes("super_admin") || isChapterStaffRole(roleNames)) {
    return true;
  }
  if (options.creatingChapter) {
    return false;
  }
  if (!roleNames.includes("local_leader")) {
    return false;
  }
  if (policy.allowLocalLeader) {
    return true;
  }
  if (policy.allowVerifiedLocalLeader && options.localLeaderVerified) {
    return true;
  }
  return false;
}

const ADMIN_OWNER_ROLES = ["admin", "super_admin", "sub_admin"] as const;

/** Role slugs eligible as group owner per Mobilize settings (+ all admins). */
export function mobilizeOwnerCandidateRoleNames(
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY
): string[] {
  const names = new Set<string>([...ADMIN_OWNER_ROLES]);
  if (policy.allowLocalLeader || policy.allowVerifiedLocalLeader) {
    names.add("local_leader");
  }
  return [...names];
}

export async function listMobilizeOwnerCandidateUserIds(
  admin: SupabaseClient,
  policy: MobilizeGroupCreatorPolicy = DEFAULT_MOBILIZE_GROUP_CREATOR_POLICY,
  extraUserIds: string[] = []
): Promise<string[]> {
  const userIds = new Set<string>(extraUserIds.filter(Boolean));

  for (const id of await listAdminDashboardUserIds(admin)) {
    userIds.add(id);
  }

  if (policy.allowLocalLeader) {
    for (const id of await listUserIdsByRoleNames(admin, ["local_leader"])) {
      userIds.add(id);
    }
  } else if (policy.allowVerifiedLocalLeader) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("local_leader_verified", true);
    const verifiedIds = ((data ?? []) as { id: string }[]).map((r) => r.id);
    if (verifiedIds.length) {
      const leaderIds = new Set(await listUserIdsByRoleNames(admin, ["local_leader"]));
      for (const id of verifiedIds) {
        if (leaderIds.has(id)) userIds.add(id);
      }
    }
  }

  return [...userIds];
}
