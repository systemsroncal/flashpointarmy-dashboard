import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeWallPostAccess = {
  member_role: string;
  membership_status: string;
  isLeader: boolean;
  canPost: boolean;
};

export async function getMobilizeWallPostAccess(
  admin: SupabaseClient,
  groupId: string,
  userId: string
): Promise<MobilizeWallPostAccess | null> {
  const { data: membership } = await admin
    .from("mobilize_group_members")
    .select("membership_status, member_role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.membership_status !== "approved") return null;

  const { data: grp } = await admin
    .from("mobilize_groups")
    .select("wall_post_policy")
    .eq("id", groupId)
    .maybeSingle();

  const wall =
    (grp as { wall_post_policy?: string } | null)?.wall_post_policy === "leaders_only"
      ? "leaders_only"
      : "all_approved";
  const isLeader = membership.member_role === "leader";
  const canPost = wall === "all_approved" || isLeader;

  return {
    member_role: membership.member_role,
    membership_status: membership.membership_status,
    isLeader,
    canPost,
  };
}
