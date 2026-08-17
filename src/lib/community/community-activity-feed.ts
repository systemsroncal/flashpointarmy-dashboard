import type { SupabaseClient } from "@supabase/supabase-js";
import { mixCommunityActivityFeed } from "@/lib/community/feed-tiers";

export const COMMUNITY_ACTIVITY_FEED_LIMIT = 25;

/** Happening Now + Community in Action share the same lookback window. */
export const COMMUNITY_ACTIVITY_WINDOW_MS = 48 * 60 * 60 * 1000;

/** @deprecated Prefer COMMUNITY_ACTIVITY_WINDOW_MS — same 48h window. */
export const HAPPENING_NOW_WINDOW_MS = COMMUNITY_ACTIVITY_WINDOW_MS;

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
 * One page of the feed, mixed ~70% Community Activity.
 * Only includes the past {@link COMMUNITY_ACTIVITY_WINDOW_MS} (48 hours).
 * Growing `limit` returns a superset of the previous page, so "Load more" is stable.
 */
export async function loadCommunityActivityFeedPage(
  supabase: SupabaseClient,
  limit: number = COMMUNITY_ACTIVITY_FEED_LIMIT
): Promise<{ rows: CommunityActivityFeedRow[]; hasMore: boolean }> {
  const pageLimit = Math.max(1, Math.floor(limit));
  const sinceIso = new Date(Date.now() - COMMUNITY_ACTIVITY_WINDOW_MS).toISOString();
  const fetchLimit = pageLimit * FETCH_MULTIPLIER;

  let query = supabase
    .from("community_activity")
    .select(feedSelect)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (HIDDEN_COMMUNITY_FEED_CATEGORIES.size > 0) {
    query = query.not(
      "feed_category",
      "in",
      `(${[...HIDDEN_COMMUNITY_FEED_CATEGORIES].join(",")})`
    );
  }

  const { data: withinWindow } = await query;
  const candidates = (withinWindow ?? []).filter((r) => !isHiddenCommunityFeedRow(r));
  const rows = mixCommunityActivityFeed(mapFeedRows(candidates), pageLimit);
  // More rows exist in the window than this page is showing.
  const hasMore = candidates.length > rows.length;
  return { rows, hasMore };
}

export async function loadCommunityActivityFeed(
  supabase: SupabaseClient,
  limit: number = COMMUNITY_ACTIVITY_FEED_LIMIT
): Promise<CommunityActivityFeedRow[]> {
  const { rows } = await loadCommunityActivityFeedPage(supabase, limit);
  return rows;
}
