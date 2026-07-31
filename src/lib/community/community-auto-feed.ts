import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { loadOverviewStats } from "@/lib/stats/overview-stats";

const MEMBER_GOAL = 20_000;

const AUTO_CATEGORIES = {
  weeklyMembers: "auto_weekly_members",
  memberGoal: "auto_member_goal",
  sharesToday: "auto_shares_today",
} as const;

type AutoCategory = (typeof AUTO_CATEGORIES)[keyof typeof AUTO_CATEGORIES];

const MIN_INTERVAL_MS: Record<AutoCategory, number> = {
  [AUTO_CATEGORIES.weeklyMembers]: 4 * 60 * 60 * 1000,
  [AUTO_CATEGORIES.memberGoal]: 1 * 60 * 60 * 1000,
  [AUTO_CATEGORIES.sharesToday]: 1 * 60 * 60 * 1000,
};

async function lastAutoFeedAt(
  admin: SupabaseClient,
  category: AutoCategory
): Promise<number | null> {
  const { data } = await admin
    .from("community_activity")
    .select("created_at")
    .eq("feed_category", category)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.created_at) return null;
  const t = new Date(data.created_at as string).getTime();
  return Number.isNaN(t) ? null : t;
}

function startOfUtcWeekMs(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfUtcDayMs(now = Date.now()): number {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

async function countWeeklyMembers(admin: SupabaseClient): Promise<number> {
  const sinceIso = new Date(startOfUtcWeekMs()).toISOString();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countSharesToday(admin: SupabaseClient): Promise<number> {
  const sinceIso = new Date(startOfUtcDayMs()).toISOString();
  const { count, error } = await admin
    .from("community_activity")
    .select("id", { count: "exact", head: true })
    .eq("feed_category", "member_invite")
    .gte("created_at", sinceIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function totalMembersApprox(admin: SupabaseClient): Promise<number> {
  const stats = await loadOverviewStats(admin, { scope: "national", stateCode: null });
  return stats.membersEngaged + stats.localLeaders;
}

async function maybeInsertAutoFeed(
  admin: SupabaseClient,
  category: AutoCategory,
  title: string,
  iconKey: string
): Promise<boolean> {
  const now = Date.now();
  const lastAt = await lastAutoFeedAt(admin, category);
  const minGap = MIN_INTERVAL_MS[category];
  if (lastAt !== null && now - lastAt < minGap) return false;

  // After the minimum gap, use a random gate so posts feel organic.
  if (Math.random() > 0.35) return false;

  const { error } = await admin.from("community_activity").insert({
    feed_category: category,
    title,
    subtitle: null,
    state_code: null,
    icon_key: iconKey,
  });
  if (error) throw new Error(error.message);
  return true;
}

/** Inserts milestone Community in Action rows when random timing thresholds are met. */
export async function tickCommunityAutoFeeds(): Promise<{ inserted: string[] }> {
  const admin = createAdminClient();
  const inserted: string[] = [];

  const weekly = await countWeeklyMembers(admin);
  if (
    await maybeInsertAutoFeed(
      admin,
      AUTO_CATEGORIES.weeklyMembers,
      `🎯 ${weekly.toLocaleString("en-US")} new members joined FlashPoint Army this week!`,
      "trend"
    )
  ) {
    inserted.push(AUTO_CATEGORIES.weeklyMembers);
  }

  const total = await totalMembersApprox(admin);
  const remaining = Math.max(0, MEMBER_GOAL - total);
  if (
    await maybeInsertAutoFeed(
      admin,
      AUTO_CATEGORIES.memberGoal,
      `🇺🇸 Only ${remaining.toLocaleString("en-US")} members until we reach 20,000!`,
      "trend"
    )
  ) {
    inserted.push(AUTO_CATEGORIES.memberGoal);
  }

  const shares = await countSharesToday(admin);
  if (
    await maybeInsertAutoFeed(
      admin,
      AUTO_CATEGORIES.sharesToday,
      `🙌 ${shares.toLocaleString("en-US")} members have shared FlashPoint Army today.`,
      "person"
    )
  ) {
    inserted.push(AUTO_CATEGORIES.sharesToday);
  }

  return { inserted };
}
