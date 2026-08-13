import type { SupabaseClient } from "@supabase/supabase-js";
import { mixCommunityActivityFeed } from "@/lib/community/feed-tiers";

export const COMMUNITY_ACTIVITY_FEED_LIMIT = 25;

export const COMMUNITY_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Auto-generated share aggregate rows (removed from product). */
export const HIDDEN_COMMUNITY_FEED_CATEGORIES = new Set(["auto_shares_today"]);

export function isHiddenCommunityFeedRow(row: {
  feed_category: string;
  title?: string;
}): boolean {
  const cat = row.feed_category.trim().toLowerCase();
  if (HIDDEN_COMMUNITY_FEED_CATEGORIES.has(cat)) return true;
  const title = (row.title ?? "").trim();
  if (/shared FlashPoint Army today/i.test(title)) return true;
  if (/shared FlashPoint Army this month/i.test(title)) return true;
  return false;
}

export type CommunityActivityFeedRow = {
  id: string;
  feed_category: string;
  title: string;
  subtitle: string | null;
  state_code: string | null;
  created_at: string;
  icon_key: string | null;
  actor_user_id: string | null;
};

const feedSelect =
  "id, feed_category, title, subtitle, state_code, created_at, icon_key, actor_user_id";

/** Pull extra rows so the 70% community mix has enough candidates. */
const FETCH_MULTIPLIER = 4;

function mapFeedRows(
  rows: {
    id: string;
    feed_category: string;
    title: string;
    subtitle: string | null;
    state_code: string | null;
    created_at: string;
    icon_key: string | null;
    actor_user_id?: string | null;
  }[]
): CommunityActivityFeedRow[] {
  return rows.map((r) => ({
    ...r,
    icon_key: r.icon_key ?? null,
    actor_user_id: r.actor_user_id ?? null,
  }));
}

/**
 * Last {@link COMMUNITY_ACTIVITY_FEED_LIMIT} rows mixed ~70% Community Activity.
 * Prefers the past 24 hours; falls back to newest overall when the window is thin.
 */
export async function loadCommunityActivityFeed(
  supabase: SupabaseClient
): Promise<CommunityActivityFeedRow[]> {
  const sinceIso = new Date(Date.now() - COMMUNITY_ACTIVITY_WINDOW_MS).toISOString();
  const fetchLimit = COMMUNITY_ACTIVITY_FEED_LIMIT * FETCH_MULTIPLIER;

  const { data: withinWindow } = await supabase
    .from("community_activity")
    .select(feedSelect)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  let candidates = (withinWindow ?? []).filter((r) => !isHiddenCommunityFeedRow(r));

  if (candidates.length < COMMUNITY_ACTIVITY_FEED_LIMIT) {
    const { data: latest } = await supabase
      .from("community_activity")
      .select(feedSelect)
      .order("created_at", { ascending: false })
      .limit(fetchLimit);
    candidates = (latest ?? []).filter((r) => !isHiddenCommunityFeedRow(r));
  }

  return mixCommunityActivityFeed(mapFeedRows(candidates), COMMUNITY_ACTIVITY_FEED_LIMIT);
}
