/** Product tiers for Community in Action (National Overview). */
export type CommunityFeedTier =
  | "community"
  | "leader"
  | "milestone"
  | "social"
  | "impact";

const COMMUNITY_CATS = new Set([
  "group_join",
  "group_post",
  "group_comment",
  "group_reply",
  "group_like",
  "community",
  "gathering",
  "upcoming_gatherings",
  "member",
  "chapter",
]);

const LEADER_CATS = new Set(["leadership", "group_leader_post"]);

const MILESTONE_CATS = new Set([
  "training_session",
  "training_course",
  "training_briefing",
  "missions",
  "certificate_request",
  "auto_member_goal",
]);

const SOCIAL_CATS = new Set([
  "social_follow",
  "member_invite",
  "auto_weekly_members",
  "profile_update",
  "profile_endorsements",
  "group_invite_share",
]);

const IMPACT_CATS = new Set(["hosted_events", "growth", "impact"]);

export function resolveCommunityFeedTier(feedCategory: string): CommunityFeedTier {
  const c = feedCategory.trim().toLowerCase();
  if (COMMUNITY_CATS.has(c)) return "community";
  if (LEADER_CATS.has(c)) return "leader";
  if (MILESTONE_CATS.has(c)) return "milestone";
  if (SOCIAL_CATS.has(c)) return "social";
  if (IMPACT_CATS.has(c)) return "impact";
  // Legacy / manual rows default to community heartbeat.
  if (c === "manual") return "community";
  return "community";
}

export const COMMUNITY_FEED_TIER_LABELS: Record<CommunityFeedTier, string> = {
  community: "Community Activity",
  leader: "Leader Activity",
  milestone: "Member Milestones",
  social: "Social Connections",
  impact: "Impact",
};

/**
 * Build a feed that is ~70% Community Activity, with the rest from other tiers.
 * Within each tier, rows stay newest-first; final list is re-sorted by time.
 */
export function mixCommunityActivityFeed<T extends { feed_category: string; created_at: string }>(
  rows: T[],
  limit: number,
  communityShare = 0.7
): T[] {
  if (rows.length <= limit) {
    return [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const buckets: Record<CommunityFeedTier, T[]> = {
    community: [],
    leader: [],
    milestone: [],
    social: [],
    impact: [],
  };
  for (const row of rows) {
    buckets[resolveCommunityFeedTier(row.feed_category)].push(row);
  }
  for (const key of Object.keys(buckets) as CommunityFeedTier[]) {
    buckets[key].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const communityTarget = Math.max(1, Math.round(limit * communityShare));
  const otherTarget = Math.max(0, limit - communityTarget);
  const picked: T[] = [];
  const used = new Set<T>();

  const take = (list: T[], n: number) => {
    let taken = 0;
    for (const row of list) {
      if (taken >= n) break;
      if (used.has(row)) continue;
      used.add(row);
      picked.push(row);
      taken += 1;
    }
    return taken;
  };

  take(buckets.community, communityTarget);

  const otherOrder: CommunityFeedTier[] = ["leader", "milestone", "social", "impact"];
  let remainingOther = otherTarget;
  // Round-robin so one tier does not starve the rest.
  while (remainingOther > 0) {
    let progressed = false;
    for (const tier of otherOrder) {
      if (remainingOther <= 0) break;
      const n = take(buckets[tier], 1);
      if (n > 0) {
        remainingOther -= n;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  // Backfill with newest leftovers (prefer community).
  if (picked.length < limit) {
    const leftovers = rows
      .filter((r) => !used.has(r))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    take(leftovers, limit - picked.length);
  }

  return picked.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

