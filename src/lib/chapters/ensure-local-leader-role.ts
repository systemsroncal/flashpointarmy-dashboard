import type { SupabaseClient } from "@supabase/supabase-js";
import { loadUserRoleNames } from "@/lib/auth/user-roles";

/**
 * When a user is assigned as a chapter leader in the Chapters panel, ensure they
 * have the `local_leader` role so National Overview / People counts update.
 * Elevated staff roles are left unchanged.
 */
export async function ensureLocalLeaderRoleForChapterAssignee(
  admin: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const roles = await loadUserRoleNames(admin, userId);
  if (
    roles.includes("super_admin") ||
    roles.includes("admin") ||
    roles.includes("sub_admin")
  ) {
    return {};
  }
  if (roles.includes("local_leader")) return {};

  const { data: roleRows, error: roleErr } = await admin
    .from("roles")
    .select("id, name")
    .in("name", ["member", "local_leader"]);
  if (roleErr) return { error: roleErr.message };

  const memberId = roleRows?.find((r) => r.name === "member")?.id as string | undefined;
  const leaderId = roleRows?.find((r) => r.name === "local_leader")?.id as string | undefined;
  if (!leaderId) return { error: "Role local_leader not found." };

  if (memberId) {
    await admin.from("user_roles").delete().eq("user_id", userId).eq("role_id", memberId);
  }

  const { error: insErr } = await admin.from("user_roles").upsert(
    { user_id: userId, role_id: leaderId },
    { onConflict: "user_id,role_id" }
  );
  if (insErr) return { error: insErr.message };
  return {};
}

/**
 * Distinct local leaders = users with `local_leader` in user_roles
 * UNION users linked in chapter_leaders (covers panel assignments).
 */
export async function countDistinctLocalLeaders(
  supabase: SupabaseClient,
  opts?: { chapterIds?: string[] }
): Promise<number> {
  const ids = new Set<string>();

  const { data: leaderRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();

  if (leaderRole?.id) {
    if (opts?.chapterIds && opts.chapterIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id")
        .in("primary_chapter_id", opts.chapterIds);
      const userIds = (profs ?? []).map((p: { id: string }) => p.id);
      if (userIds.length > 0) {
        const { data: ur } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role_id", leaderRole.id as string)
          .in("user_id", userIds);
        for (const r of ur ?? []) {
          if (r.user_id) ids.add(r.user_id as string);
        }
      }
    } else {
      const { data: ur } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", leaderRole.id as string);
      for (const r of ur ?? []) {
        if (r.user_id) ids.add(r.user_id as string);
      }
    }
  }

  let clQuery = supabase.from("chapter_leaders").select("user_id");
  if (opts?.chapterIds && opts.chapterIds.length > 0) {
    clQuery = clQuery.in("chapter_id", opts.chapterIds);
  }
  const { data: cl } = await clQuery;
  for (const r of cl ?? []) {
    if (r.user_id) ids.add(r.user_id as string);
  }

  return ids.size;
}
