import type { SupabaseClient } from "@supabase/supabase-js";
import { isMobilizeSuperAdmin } from "@/lib/mobilize/mobilize-content-access";

export async function loadGroupUpdatesAllowGroupLeaders(
  admin: SupabaseClient
): Promise<boolean> {
  const { data, error } = await admin
    .from("mobilize_policy_settings")
    .select("group_updates_allow_group_leaders")
    .eq("id", 1)
    .maybeSingle();
  if (error) return true;
  const v = (data as { group_updates_allow_group_leaders?: boolean } | null)
    ?.group_updates_allow_group_leaders;
  return v !== false;
}

/** Super admins always; group leaders when policy allows (default on). */
export async function canManageGroupUpdateNotifications(input: {
  admin: SupabaseClient;
  roleNames: string[];
  groupId: string;
  userId: string;
}): Promise<boolean> {
  if (isMobilizeSuperAdmin(input.roleNames)) return true;

  const allowLeaders = await loadGroupUpdatesAllowGroupLeaders(input.admin);
  if (!allowLeaders) return false;

  const { data: me } = await input.admin
    .from("mobilize_group_members")
    .select("member_role, membership_status")
    .eq("group_id", input.groupId)
    .eq("user_id", input.userId)
    .maybeSingle();

  return Boolean(
    me &&
      me.membership_status === "approved" &&
      me.member_role === "leader"
  );
}
