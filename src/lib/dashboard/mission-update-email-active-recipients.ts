import type { SupabaseClient } from "@supabase/supabase-js";

/** Rolling activity window for Mission Update email recipients (matches dashboard presence retention). */
export const DEFAULT_MISSION_UPDATE_EMAIL_ACTIVE_DAYS = 7;

export function missionUpdateEmailRequireRecentActivity(): boolean {
  const raw = process.env.MISSION_UPDATE_EMAIL_REQUIRE_RECENT_ACTIVITY?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") return false;
  return true;
}

export function missionUpdateEmailActiveDays(): number {
  const raw = process.env.MISSION_UPDATE_EMAIL_ACTIVE_DAYS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_MISSION_UPDATE_EMAIL_ACTIVE_DAYS;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MISSION_UPDATE_EMAIL_ACTIVE_DAYS;
  return Math.min(n, 30);
}

export function missionUpdateEmailActiveSinceIso(): string {
  const days = missionUpdateEmailActiveDays();
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Users with dashboard presence pulse or Auth sign-in since `since`. */
export async function loadRecentlyActiveUserIdSet(
  admin: SupabaseClient,
  sinceIso?: string
): Promise<Set<string>> {
  const since = sinceIso ?? missionUpdateEmailActiveSinceIso();
  const { data, error } = await admin.rpc("mission_update_email_active_user_ids", {
    p_active_since: since,
  });

  if (error) {
    throw new Error(error.message);
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    const id = String((row as { user_id: string }).user_id);
    if (id) set.add(id);
  }
  return set;
}

export async function filterMissionUpdateEmailRecipients(
  admin: SupabaseClient,
  candidateIds: string[],
  opts?: { bypassActivityFilter?: boolean }
): Promise<{ recipientIds: string[]; excludedInactive: number }> {
  const unique = [...new Set(candidateIds.filter(Boolean))];
  if (!unique.length) return { recipientIds: [], excludedInactive: 0 };
  if (opts?.bypassActivityFilter || !missionUpdateEmailRequireRecentActivity()) {
    return { recipientIds: unique, excludedInactive: 0 };
  }

  const activeSet = await loadRecentlyActiveUserIdSet(admin);
  const recipientIds = unique.filter((id) => activeSet.has(id));
  return {
    recipientIds,
    excludedInactive: unique.length - recipientIds.length,
  };
}