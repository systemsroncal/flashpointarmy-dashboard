import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeGroupBrowseExtras = {
  member_count: number;
  leader_names: string[];
  my_membership_status: string | null;
};

/**
 * Adds member_count, leader display names, and current user's membership status per group.
 */
export async function enrichMobilizeGroupsBrowse(
  admin: SupabaseClient,
  groups: { id: string }[],
  userId: string
): Promise<Map<string, MobilizeGroupBrowseExtras>> {
  const out = new Map<string, MobilizeGroupBrowseExtras>();
  if (!groups.length) return out;

  const ids = [...new Set(groups.map((g) => g.id))];

  const { data: rows, error } = await admin
    .from("mobilize_group_members")
    .select("group_id, user_id, member_role, membership_status")
    .in("group_id", ids);

  if (error) {
    for (const id of ids) {
      out.set(id, { member_count: 0, leader_names: [], my_membership_status: null });
    }
    return out;
  }

  if (!rows?.length) {
    for (const id of ids) {
      out.set(id, { member_count: 0, leader_names: [], my_membership_status: null });
    }
    return out;
  }

  const leaderIds = new Set<string>();
  const byGroup = new Map<string, typeof rows>();
  for (const r of rows) {
    const gid = r.group_id as string;
    const list = byGroup.get(gid) ?? [];
    list.push(r);
    byGroup.set(gid, list);
    if (r.member_role === "leader" && r.membership_status === "approved") {
      leaderIds.add(r.user_id as string);
    }
  }

  const leaderIdList = [...leaderIds];
  const nameByUser = new Map<string, string>();
  if (leaderIdList.length) {
    const { data: du } = await admin
      .from("dashboard_users")
      .select("id, display_name, email")
      .in("id", leaderIdList);
    for (const u of du ?? []) {
      const id = u.id as string;
      const dn = String((u as { display_name?: string }).display_name ?? "").trim();
      const em = String((u as { email?: string }).email ?? "").trim();
      nameByUser.set(id, dn || em || id.slice(0, 8));
    }
  }

  for (const id of ids) {
    const list = byGroup.get(id) ?? [];
    const approved = list.filter((m) => m.membership_status === "approved");
    const leaderNames = approved
      .filter((m) => m.member_role === "leader")
      .map((m) => nameByUser.get(m.user_id as string) ?? String(m.user_id).slice(0, 8));
    const mine = list.find((m) => m.user_id === userId);
    out.set(id, {
      member_count: approved.length,
      leader_names: leaderNames,
      my_membership_status: mine ? (mine.membership_status as string) : null,
    });
  }

  return out;
}
