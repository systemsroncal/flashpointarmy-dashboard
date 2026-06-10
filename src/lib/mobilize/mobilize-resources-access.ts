import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeResourcesPostAccess = {
  member_role: string;
  membership_status: string;
  isLeader: boolean;
  canPost: boolean;
};

export async function getMobilizeResourcesPostAccess(
  admin: SupabaseClient,
  groupId: string,
  userId: string
): Promise<MobilizeResourcesPostAccess | null> {
  const { data: membership } = await admin
    .from("mobilize_group_members")
    .select("membership_status, member_role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.membership_status !== "approved") return null;

  const { data: grp } = await admin
    .from("mobilize_groups")
    .select("resources_post_policy")
    .eq("id", groupId)
    .maybeSingle();

  const policy =
    (grp as { resources_post_policy?: string } | null)?.resources_post_policy === "leaders_only"
      ? "leaders_only"
      : "all_approved";
  const isLeader = membership.member_role === "leader";
  const canPost = policy === "all_approved" || isLeader;

  return {
    member_role: membership.member_role,
    membership_status: membership.membership_status,
    isLeader,
    canPost,
  };
}
