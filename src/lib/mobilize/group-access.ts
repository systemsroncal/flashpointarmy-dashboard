import { createAdminClient } from "@/utils/supabase/admin";

export type GroupMemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  member_role: "leader" | "member";
  status: "pending" | "approved" | "rejected";
};

export async function fetchMembership(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  userId: string
): Promise<GroupMemberRow | null> {
  const { data, error } = await admin
    .from("mobilize_group_members")
    .select("id, group_id, user_id, member_role, status")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as GroupMemberRow;
}

export async function isApprovedLeader(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const m = await fetchMembership(admin, groupId, userId);
  return Boolean(m && m.status === "approved" && m.member_role === "leader");
}

export async function isApprovedMember(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string,
  userId: string
): Promise<boolean> {
  const m = await fetchMembership(admin, groupId, userId);
  return Boolean(m && m.status === "approved");
}

export async function loadGroup(
  admin: ReturnType<typeof createAdminClient>,
  groupId: string
) {
  const { data, error } = await admin.from("mobilize_groups").select("*").eq("id", groupId).maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}
