import type { SupabaseClient } from "@supabase/supabase-js";

export const COMMUNITY_ACTIVITY_FEED_LIMIT = 25;

export const COMMUNITY_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type CommunityActivityFeedRow = {
  id: string;
  feed_category: string;
  title: string;
  subtitle: string | null;
  state_code: string | null;
  created_at: string;
  icon_key: string | null;
};

const feedSelect =
  "id, feed_category, title, subtitle, state_code, created_at, icon_key";

function mapFeedRows(
  rows: {
    id: string;
    feed_category: string;
    title: string;
    subtitle: string | null;
    state_code: string | null;
    created_at: string;
    icon_key: string | null;
  }[]
): CommunityActivityFeedRow[] {
  return rows.map((r) => ({ ...r, icon_key: r.icon_key ?? null }));
}

/**
 * Last {@link COMMUNITY_ACTIVITY_FEED_LIMIT} rows from the past 24 hours.
 * If fewer than 25 exist in that window, returns the 25 most recent overall.
 */
export async function loadCommunityActivityFeed(
  supabase: SupabaseClient
): Promise<CommunityActivityFeedRow[]> {
  const sinceIso = new Date(Date.now() - COMMUNITY_ACTIVITY_WINDOW_MS).toISOString();

  const { data: withinWindow } = await supabase
    .from("community_activity")
    .select(feedSelect)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(COMMUNITY_ACTIVITY_FEED_LIMIT);

  const windowRows = withinWindow ?? [];
  if (windowRows.length >= COMMUNITY_ACTIVITY_FEED_LIMIT) {
    return mapFeedRows(windowRows);
  }

  const { data: latest } = await supabase
    .from("community_activity")
    .select(feedSelect)
    .order("created_at", { ascending: false })
    .limit(COMMUNITY_ACTIVITY_FEED_LIMIT);

  return mapFeedRows(latest ?? []);
}
