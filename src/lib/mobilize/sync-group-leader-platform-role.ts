import { loadUserRoleNames } from "@/lib/auth/user-roles";
import type { SupabaseClient } from "@supabase/supabase-js";

async function userHasAnyApprovedGroupLeaderSeat(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count, error } = await admin
    .from("mobilize_group_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved");
  if (error) return true;
  return (count ?? 0) > 0;
}

/**
 * Keep People directory in sync: Mobilize group leaders appear under Leaders, not Members.
 */
export async function syncPlatformRoleForMobilizeGroupLeader(
  admin: SupabaseClient,
  userId: string,
  nextMemberRole: "leader" | "member"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const roleNames = await loadUserRoleNames(admin, userId);
  if (
    roleNames.includes("super_admin") ||
    roleNames.includes("admin") ||
    roleNames.includes("sub_admin")
  ) {
    return { ok: true };
  }

  let targetRole: "member" | "local_leader";
  if (nextMemberRole === "leader") {
    targetRole = "local_leader";
  } else {
    const stillLeader = await userHasAnyApprovedGroupLeaderSeat(admin, userId);
    if (stillLeader) return { ok: true };
    if (!roleNames.includes("local_leader")) return { ok: true };
    targetRole = "member";
  }

  if (targetRole === "local_leader" && !roleNames.includes("member") && !roleNames.includes("local_leader")) {
    return { ok: true };
  }

  if (targetRole === "member" && !roleNames.includes("local_leader")) {
    return { ok: true };
  }

  const { error: rpcErr } = await admin.rpc("assign_invited_user_primary_role", {
    p_user_id: userId,
    p_role_name: targetRole,
  });
  if (rpcErr) {
    return { ok: false, error: rpcErr.message || "Could not update platform role." };
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", userId)
    .maybeSingle();
  const chapterId = prof?.primary_chapter_id ?? null;

  if (chapterId) {
    if (targetRole === "local_leader") {
      const { error: clErr } = await admin.from("chapter_leaders").upsert(
        { chapter_id: chapterId, user_id: userId },
        { onConflict: "chapter_id,user_id" }
      );
      if (clErr) {
        return { ok: false, error: clErr.message || "Role updated but chapter leader link failed." };
      }
    } else {
      await admin.from("chapter_leaders").delete().eq("chapter_id", chapterId).eq("user_id", userId);
    }
  }

  return { ok: true };
}