import { chunkIdsForInQuery } from "@/lib/admin/dashboard-user-queries";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Users who count as "Missions started" (Yes) on Journey Progress /
 * National Overview "Started Missions".
 *
 * True when any of:
 * - confirmed the /dashboard/missions welcome popup (`missions_started_notified_at`)
 * - dismissed/seen that welcome (`missions_welcome_seen_at`)
 * - has a first-mission row unlocked or further (`pending` | `in_progress` | `completed`)
 */
export function isMissionsStartedForUser(args: {
  missions_started_notified_at?: string | null;
  missions_welcome_seen_at?: string | null;
  firstMissionStatus?: string | null;
}): boolean {
  if (args.missions_started_notified_at || args.missions_welcome_seen_at) return true;
  const s = args.firstMissionStatus;
  return s === "pending" || s === "in_progress" || s === "completed";
}

export async function loadMissionsStartedUserIds(
  admin: SupabaseClient,
  userIds?: string[]
): Promise<Set<string>> {
  const out = new Set<string>();

  if (userIds && userIds.length === 0) return out;

  const idChunks = userIds ? chunkIdsForInQuery(userIds, 200) : [null];

  for (const part of idChunks) {
    let milestonesQuery = admin
      .from("member_journey_milestones")
      .select("user_id, missions_started_notified_at, missions_welcome_seen_at");
    if (part) milestonesQuery = milestonesQuery.in("user_id", part);

    const { data: milestones, error: mErr } = await milestonesQuery;
    if (mErr) throw new Error(mErr.message);
    for (const row of milestones ?? []) {
      if (
        isMissionsStartedForUser({
          missions_started_notified_at: row.missions_started_notified_at as string | null,
          missions_welcome_seen_at: row.missions_welcome_seen_at as string | null,
        })
      ) {
        out.add(row.user_id as string);
      }
    }

    let firstQuery = admin
      .from("member_first_missions")
      .select("user_id, status")
      .in("status", ["pending", "in_progress", "completed"]);
    if (part) firstQuery = firstQuery.in("user_id", part);

    const { data: firstMissions, error: fErr } = await firstQuery;
    if (fErr) throw new Error(fErr.message);
    for (const row of firstMissions ?? []) {
      out.add(row.user_id as string);
    }
  }

  return out;
}

/** Global count of dashboard users marked Missions started = Yes. */
export async function countDashboardUsersMissionsStarted(
  admin: SupabaseClient
): Promise<number> {
  const started = await loadMissionsStartedUserIds(admin);
  if (started.size === 0) return 0;

  // Restrict to real dashboard users so National Overview matches Journey Progress.
  const ids = [...started];
  let total = 0;
  for (const part of chunkIdsForInQuery(ids, 200)) {
    const { count, error } = await admin
      .from("dashboard_users")
      .select("id", { count: "exact", head: true })
      .in("id", part);
    if (error) throw new Error(error.message);
    total += count ?? 0;
  }
  return total;
}
