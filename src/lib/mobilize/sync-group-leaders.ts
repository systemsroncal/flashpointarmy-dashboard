import type { SupabaseClient } from "@supabase/supabase-js";

async function ensureApprovedLeader(
  admin: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { data: existing } = await admin
    .from("mobilize_group_members")
    .select("id, member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await admin
      .from("mobilize_group_members")
      .update({ member_role: "leader", membership_status: "approved" })
      .eq("id", existing.id);
    return;
  }

  await admin.from("mobilize_group_members").insert({
    group_id: groupId,
    user_id: userId,
    member_role: "leader",
    membership_status: "approved",
  });
}

async function countApprovedLeaders(admin: SupabaseClient, groupId: string): Promise<number> {
  const { count } = await admin
    .from("mobilize_group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("membership_status", "approved")
    .eq("member_role", "leader");
  return count ?? 0;
}

async function demoteApprovedLeaderToMember(
  admin: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { data: row } = await admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!row || row.membership_status !== "approved" || row.member_role !== "leader") return;

  const leaders = await countApprovedLeaders(admin, groupId);
  if (leaders <= 1) {
    throw new Error("Cannot remove the last group administrator.");
  }

  await admin
    .from("mobilize_group_members")
    .update({ member_role: "member" })
    .eq("group_id", groupId)
    .eq("user_id", userId);
}

export type MobilizeGroupOwnerSyncInput = {
  previousCreatedBy: string;
  newCreatedBy?: string;
  /** Full set of approved leaders (group administrators). Primary owner is always included. */
  leaderUserIds?: string[];
};

/**
 * Applies primary owner (`mobilize_groups.created_by`) and leader memberships together.
 * Replacing primary owner demotes the previous primary from leader → member unless they remain in `leaderUserIds`.
 */
export async function applyMobilizeGroupOwnerAndLeaders(
  admin: SupabaseClient,
  groupId: string,
  input: MobilizeGroupOwnerSyncInput
): Promise<void> {
  const newOwner = input.newCreatedBy?.trim();
  const leaderSet = new Set<string>(
    (input.leaderUserIds ?? []).map((id) => id.trim()).filter(Boolean)
  );
  if (newOwner) leaderSet.add(newOwner);

  if (!newOwner && leaderSet.size === 0) return;

  const replacePrimaryOnly =
    Boolean(newOwner) &&
    newOwner !== input.previousCreatedBy &&
    leaderSet.size === 1 &&
    leaderSet.has(newOwner!);

  if (replacePrimaryOnly && newOwner) {
    await ensureApprovedLeader(admin, groupId, newOwner);
    if (input.previousCreatedBy && input.previousCreatedBy !== newOwner) {
      try {
        await demoteApprovedLeaderToMember(admin, groupId, input.previousCreatedBy);
      } catch {
        /* previous primary may already be a regular member */
      }
    }
    return;
  }

  if (leaderSet.size > 0) {
    const { data: currentLeaders } = await admin
      .from("mobilize_group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("membership_status", "approved")
      .eq("member_role", "leader");

    for (const userId of leaderSet) {
      await ensureApprovedLeader(admin, groupId, userId);
    }

    for (const row of currentLeaders ?? []) {
      const uid = String(row.user_id);
      if (!leaderSet.has(uid)) {
        await demoteApprovedLeaderToMember(admin, groupId, uid);
      }
    }
    return;
  }

  if (newOwner) {
    await ensureApprovedLeader(admin, groupId, newOwner);
  }
}
