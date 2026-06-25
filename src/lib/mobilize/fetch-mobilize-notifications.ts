import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrivacyName } from "@/lib/user/format-privacy-name";

export type MobilizePendingJoinNotification = {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  group_name: string;
  user_display_name: string;
  user_email: string | null;
  user_avatar_url: string | null;
};

export type MobilizeRecentEventNotification = {
  id: string;
  group_id: string;
  title: string;
  date_time: string;
  created_at: string;
  group_name: string;
};

export type MobilizeNotificationsPayload = {
  pendingJoinRequests: MobilizePendingJoinNotification[];
  recentGroupEvents: MobilizeRecentEventNotification[];
  pendingCount: number;
};

function displayNameFromUser(
  userId: string,
  du?: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
  } | null
) {
  const em = (du?.email ?? "").trim();
  return formatPrivacyName(du?.first_name, du?.last_name, du?.display_name?.trim() || em || `User ${userId.slice(0, 8)}`);
}

export async function fetchMobilizeNotifications(
  admin: SupabaseClient,
  userId: string
): Promise<MobilizeNotificationsPayload> {
  const { data: leaderRows, error: lErr } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("member_role", "leader")
    .eq("membership_status", "approved");

  if (lErr) throw new Error(lErr.message);

  const leaderGroupIds = (leaderRows ?? []).map((r: { group_id: string }) => r.group_id);
  let pendingJoins: { id: string; group_id: string; user_id: string; created_at: string }[] = [];
  if (leaderGroupIds.length) {
    const { data: pending, error: pErr } = await admin
      .from("mobilize_group_members")
      .select("id, group_id, user_id, created_at")
      .in("group_id", leaderGroupIds)
      .eq("membership_status", "pending")
      .order("created_at", { ascending: false });
    if (!pErr && pending) pendingJoins = pending;
  }

  const { data: myGroups, error: gErr } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("membership_status", "approved");

  if (gErr) throw new Error(gErr.message);

  const myGroupIds = (myGroups ?? []).map((r: { group_id: string }) => r.group_id);
  let recentEvents: { id: string; group_id: string; title: string; date_time: string; created_at: string }[] =
    [];
  if (myGroupIds.length) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();
    const { data: ev, error: eErr } = await admin
      .from("mobilize_events")
      .select("id, group_id, title, date_time, created_at")
      .in("group_id", myGroupIds)
      .gte("date_time", nowIso)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!eErr && ev) recentEvents = ev as typeof recentEvents;
  }

  const groupIds = [
    ...new Set([
      ...pendingJoins.map((p) => p.group_id),
      ...recentEvents.map((e) => e.group_id),
    ]),
  ];
  const userIds = [...new Set(pendingJoins.map((p) => p.user_id))];

  const groupNameById = new Map<string, string>();
  if (groupIds.length) {
    const { data: groups } = await admin.from("mobilize_groups").select("id, name").in("id", groupIds);
    for (const g of groups ?? []) {
      groupNameById.set(g.id as string, String((g as { name?: string }).name ?? "").trim() || "Unnamed group");
    }
  }

  const duById = new Map<
    string,
    { first_name: string | null; last_name: string | null; display_name: string | null; email: string | null }
  >();
  const avatarById = new Map<string, string | null>();
  if (userIds.length) {
    const { data: du } = await admin
      .from("dashboard_users")
      .select("id, first_name, last_name, display_name, email")
      .in("id", userIds);
    for (const u of du ?? []) {
      duById.set(u.id as string, {
        first_name: (u as { first_name?: string | null }).first_name ?? null,
        last_name: (u as { last_name?: string | null }).last_name ?? null,
        display_name: (u as { display_name?: string | null }).display_name ?? null,
        email: (u as { email?: string | null }).email ?? null,
      });
    }
    const { data: pr } = await admin.from("profiles").select("id, avatar_url").in("id", userIds);
    for (const p of pr ?? []) {
      avatarById.set(p.id as string, (p as { avatar_url?: string | null }).avatar_url ?? null);
    }
  }

  const pendingJoinRequests: MobilizePendingJoinNotification[] = pendingJoins.map((p) => ({
    ...p,
    group_name: groupNameById.get(p.group_id) ?? "Unnamed group",
    user_display_name: displayNameFromUser(p.user_id, duById.get(p.user_id)),
    user_email: duById.get(p.user_id)?.email ?? null,
    user_avatar_url: avatarById.get(p.user_id) ?? null,
  }));

  const recentGroupEvents: MobilizeRecentEventNotification[] = recentEvents.map((e) => ({
    ...e,
    group_name: groupNameById.get(e.group_id) ?? "Unnamed group",
  }));

  return {
    pendingJoinRequests,
    recentGroupEvents,
    pendingCount: pendingJoinRequests.length,
  };
}
