import type { SupabaseClient } from "@supabase/supabase-js";

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
  if (roleNames.some((n) => n === "super_admin" || n === "admin")) return true;
  if (policy.allowLocalLeader && roleNames.includes("local_leader")) return true;
  if (policy.allowMember && roleNames.includes("member")) return true;
  return false;
}
