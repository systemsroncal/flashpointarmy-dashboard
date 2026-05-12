import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeGroupLeaderBrief = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  /** Resolved display: "First Last", else display_name, else email, else short id. */
  full_name: string;
};

export type MobilizeGroupBrowseExtras = {
  member_count: number;
  leader_names: string[];
  leaders: MobilizeGroupLeaderBrief[];
  my_membership_status: string | null;
  /** Mobilize events with date_time >= now (this group only). */
  upcoming_activity_count: number;
};

type DuRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  profiles: { avatar_url: string | null } | { avatar_url: string | null }[] | null;
};

function avatarFromProfiles(p: DuRow["profiles"]): string | null {
  if (!p) return null;
  const o = Array.isArray(p) ? p[0] : p;
  return o?.avatar_url ?? null;
}

function fullNameFromRow(u: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  id?: string;
}): string {
  const fn = String(u.first_name ?? "").trim();
  const ln = String(u.last_name ?? "").trim();
  const both = [fn, ln].filter(Boolean).join(" ").trim();
  if (both) return both;
  const dn = String(u.display_name ?? "").trim();
  if (dn) return dn;
  const em = String(u.email ?? "").trim();
  if (em) return em;
  return String(u.id ?? "?").slice(0, 8);
}

function emptyExtras(): MobilizeGroupBrowseExtras {
  return {
    member_count: 0,
    leader_names: [],
    leaders: [],
    my_membership_status: null,
    upcoming_activity_count: 0,
  };
}

/**
 * Adds member_count, leader display names, leader avatars/names, and current user's membership status per group.
 */
export async function enrichMobilizeGroupsBrowse(
  admin: SupabaseClient,
  groups: { id: string }[],
  userId: string
): Promise<Map<string, MobilizeGroupBrowseExtras>> {
  const out = new Map<string, MobilizeGroupBrowseExtras>();
  if (!groups.length) return out;

  const ids = [...new Set(groups.map((g) => g.id))];

  const nowIso = new Date().toISOString();
  const upcomingByGroup = new Map<string, number>();
  for (const id of ids) upcomingByGroup.set(id, 0);
  const { data: upcomingRows } = await admin
    .from("mobilize_events")
    .select("group_id")
    .in("group_id", ids)
    .gte("date_time", nowIso);
  for (const row of upcomingRows ?? []) {
    const gid = (row as { group_id: string }).group_id;
    upcomingByGroup.set(gid, (upcomingByGroup.get(gid) ?? 0) + 1);
  }

  const extrasWithUpcoming = (base: MobilizeGroupBrowseExtras, id: string): MobilizeGroupBrowseExtras => ({
    ...base,
    upcoming_activity_count: upcomingByGroup.get(id) ?? 0,
  });

  const { data: rows, error } = await admin
    .from("mobilize_group_members")
    .select("group_id, user_id, member_role, membership_status")
    .in("group_id", ids);

  if (error) {
    for (const id of ids) {
      out.set(id, extrasWithUpcoming(emptyExtras(), id));
    }
    return out;
  }

  if (!rows?.length) {
    for (const id of ids) {
      out.set(id, extrasWithUpcoming(emptyExtras(), id));
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
  const briefByUser = new Map<string, MobilizeGroupLeaderBrief>();

  if (leaderIdList.length) {
    const { data: du } = await admin
      .from("dashboard_users")
      .select("id, first_name, last_name, display_name, email, profiles(avatar_url)")
      .in("id", leaderIdList);
    for (const raw of du ?? []) {
      const u = raw as DuRow;
      const id = u.id as string;
      briefByUser.set(id, {
        user_id: id,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        display_name: u.display_name ?? null,
        email: u.email ?? null,
        avatar_url: avatarFromProfiles(u.profiles),
        full_name: fullNameFromRow(u),
      });
    }
  }

  for (const id of ids) {
    const list = byGroup.get(id) ?? [];
    const approved = list.filter((m) => m.membership_status === "approved");
    const leaderMembers = approved.filter((m) => m.member_role === "leader");
    const leaders: MobilizeGroupLeaderBrief[] = leaderMembers.map((m) => {
      const uid = m.user_id as string;
      const b = briefByUser.get(uid);
      if (b) return b;
      return {
        user_id: uid,
        first_name: null,
        last_name: null,
        display_name: null,
        email: null,
        avatar_url: null,
        full_name: uid.slice(0, 8),
      };
    });
    const leaderNames = leaders.map((l) => l.full_name);
    const mine = list.find((m) => m.user_id === userId);
    out.set(id, {
      member_count: approved.length,
      leader_names: leaderNames,
      leaders,
      my_membership_status: mine ? (mine.membership_status as string) : null,
      upcoming_activity_count: upcomingByGroup.get(id) ?? 0,
    });
  }

  return out;
}
