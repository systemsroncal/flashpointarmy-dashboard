import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";
import { loadOverviewStats } from "@/lib/stats/overview-stats";

const MEMBER_GOAL = 20_000;

const AUTO_CATEGORIES = {
  weeklyMembers: "auto_weekly_members",
  memberGoal: "auto_member_goal",
} as const;

type AutoCategory = (typeof AUTO_CATEGORIES)[keyof typeof AUTO_CATEGORIES];

const MIN_INTERVAL_MS: Record<AutoCategory, number> = {
  [AUTO_CATEGORIES.weeklyMembers]: 4 * 60 * 60 * 1000,
  [AUTO_CATEGORIES.memberGoal]: 6 * 24 * 60 * 60 * 1000,
};

/** FlashPoint Army default schedule timezone for weekly milestone posts. */
const MILESTONE_TZ = "America/New_York";

function getZonedParts(now = new Date(), timeZone = MILESTONE_TZ) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
  return { weekday, hour };
}

function isThursdayNoonInTimeZone(now = new Date(), timeZone = MILESTONE_TZ): boolean {
  const { weekday, hour } = getZonedParts(now, timeZone);
  return weekday === "Thu" && hour === 12;
}

/** Weekly new-members feed: Thu & Sun at 12:00 and 20:00 (America/New_York). */
function isWeeklyMembersPostWindow(now = new Date(), timeZone = MILESTONE_TZ): boolean {
  const { weekday, hour } = getZonedParts(now, timeZone);
  const allowedDay = weekday === "Thu" || weekday === "Sun";
  const allowedHour = hour === 12 || hour === 20;
  return allowedDay && allowedHour;
}

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

async function countWeeklyMembers(admin: SupabaseClient): Promise<number> {
  const sinceIso = new Date(startOfUtcWeekMs()).toISOString();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
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
  subtitle: string,
  iconKey: string,
  options?: { skipRandom?: boolean }
): Promise<boolean> {
  const now = Date.now();
  const lastAt = await lastAutoFeedAt(admin, category);
  const minGap = MIN_INTERVAL_MS[category];
  if (lastAt !== null && now - lastAt < minGap) return false;

  // After the minimum gap, use a random gate so organic posts feel less mechanical.
  if (!options?.skipRandom && Math.random() > 0.35) return false;

  const { error } = await admin.from("community_activity").insert({
    feed_category: category,
    title,
    subtitle,
    state_code: null,
    icon_key: iconKey,
  });
  if (error) throw new Error(error.message);
  return true;
}

/** Inserts milestone Community in Action rows when schedule/timing thresholds are met. */
export async function tickCommunityAutoFeeds(): Promise<{ inserted: string[] }> {
  const admin = createAdminClient();
  const inserted: string[] = [];

  const weekly = await countWeeklyMembers(admin);
  if (
    isWeeklyMembersPostWindow() &&
    (await maybeInsertAutoFeed(
      admin,
      AUTO_CATEGORIES.weeklyMembers,
      `👥 ${weekly.toLocaleString("en-US")} new members joined FlashPoint Army this week!`,
      "Welcome to our growing community",
      "groups",
      { skipRandom: true }
    ))
  ) {
    inserted.push(AUTO_CATEGORIES.weeklyMembers);
  }

  const total = await totalMembersApprox(admin);
  const remaining = Math.max(0, MEMBER_GOAL - total);
  if (
    isThursdayNoonInTimeZone() &&
    (await maybeInsertAutoFeed(
      admin,
      AUTO_CATEGORIES.memberGoal,
      `🎯 Only ${remaining.toLocaleString("en-US")} members until we reach 20,000!`,
      "Together we're almost there",
      "target"
    ))
  ) {
    inserted.push(AUTO_CATEGORIES.memberGoal);
  }

  return { inserted };
}
