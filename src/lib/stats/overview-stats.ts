import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COMMUNITY_ACTIVITY_WINDOW_MS,
  HIDDEN_COMMUNITY_FEED_CATEGORIES,
} from "@/lib/community/community-activity-feed";
import { countDashboardUsersMissionsStarted } from "@/lib/onboarding/missions-started";
import { usStateByCode } from "@/data/usStates";

export type OverviewScope = "national" | "state";

export type OverviewStatBlock = {
  activeChapters: number;
  communityGatherings: number;
  membersEngaged: number;
  localLeaders: number;
  happeningNow: number;
  /** Mobilize subgroups (parent_group_id set). */
  mobilizeGroups: number;
  /** Users with Missions started = Yes (same as Journey Progress). */
  peopleInMissions: number;
  /** Distinct people who shared the invite (social or copy). */
  inviteSharers: number;
  /** Total invite share button/copy presses. */
  inviteShares: number;
};

export function normalizeStateCode(state: string | null | undefined): string | null {
  if (!state) return null;
  const st = state.trim().toUpperCase().slice(0, 2);
  return st || null;
}

function stateMatch(state: string) {
  return normalizeStateCode(state) ?? "";
}

/** Upcoming gatherings count (future events). */
async function countUpcomingGatherings(
  supabase: SupabaseClient,
  opts: { stateFilter: string | null }
): Promise<number> {
  const nowIso = new Date().toISOString();
  if (!opts.stateFilter) {
    const { count } = await supabase
      .from("gatherings")
      .select("id", { count: "exact", head: true })
      .gt("starts_at", nowIso);
    return count ?? 0;
  }
  const st = stateMatch(opts.stateFilter);
  const { data: chIds } = await supabase.from("chapters").select("id").eq("state", st);
  const ids = (chIds ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return 0;
  const { count } = await supabase
    .from("gatherings")
    .select("id", { count: "exact", head: true })
    .gt("starts_at", nowIso)
    .in("chapter_id", ids);
  return count ?? 0;
}

/** Extra counts from reference data (e.g. cities_donors.json), not stored in DB. */
export type ReferenceAddition = { leaders: number; members: number };

/** Count Mobilize subgroups belonging to chapter-level groups (parent is a top-level chapter). */
async function countMobilizeChapterGroups(supabase: SupabaseClient): Promise<number> {
  const { data: chapters, error: chErr } = await supabase
    .from("mobilize_groups")
    .select("id")
    .is("parent_group_id", null);
  if (chErr) throw new Error(chErr.message);
  const chapterIds = (chapters ?? []).map((r: { id: string }) => r.id);
  if (chapterIds.length === 0) return 0;
  const { count, error } = await supabase
    .from("mobilize_groups")
    .select("id", { count: "exact", head: true })
    .in("parent_group_id", chapterIds);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Same “Missions started = Yes” set as /dashboard/onboarding/journey-progress. */
async function countStartedMissions(supabase: SupabaseClient): Promise<number> {
  return countDashboardUsersMissionsStarted(supabase);
}

async function countInviteShareMetrics(
  supabase: SupabaseClient
): Promise<{ inviteSharers: number; inviteShares: number }> {
  const { count: inviteShares, error: shareErr } = await supabase
    .from("invite_share_events")
    .select("id", { count: "exact", head: true });
  if (shareErr) {
    // Fallback while migration 079 is pending: community_activity member_invite rows.
    const { data: rows } = await supabase
      .from("community_activity")
      .select("actor_user_id")
      .eq("feed_category", "member_invite");
    const actors = new Set(
      (rows ?? [])
        .map((r) => (r as { actor_user_id?: string | null }).actor_user_id)
        .filter((id): id is string => Boolean(id))
    );
    return { inviteSharers: actors.size, inviteShares: rows?.length ?? 0 };
  }

  const { data: userRows, error: usersErr } = await supabase
    .from("invite_share_events")
    .select("user_id");
  if (usersErr) {
    return { inviteSharers: 0, inviteShares: inviteShares ?? 0 };
  }
  const inviteSharers = new Set(
    (userRows ?? []).map((r) => (r as { user_id: string }).user_id)
  ).size;
  return { inviteSharers, inviteShares: inviteShares ?? 0 };
}

export async function loadOverviewStats(
  supabase: SupabaseClient,
  opts: {
    scope: OverviewScope;
    stateCode: string | null;
    /** Added to national overview totals when present; gated by `NEXT_PUBLIC_REFERENCE_OVERVIEW_STATS`. */
    referenceAddition?: ReferenceAddition | null;
  },
  /** Bypass RLS for national aggregate metrics (Mobilize groups, started missions). */
  aggregateSupabase?: SupabaseClient
): Promise<OverviewStatBlock> {
  const st = opts.stateCode ? stateMatch(opts.stateCode) : null;
  const stateFilter = opts.scope === "state" ? st : null;
  const agg = aggregateSupabase ?? supabase;

  let activeChapters = 0;
  if (stateFilter) {
    const { count } = await supabase
      .from("chapters")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("state", stateFilter);
    activeChapters = count ?? 0;
  } else {
    const { count } = await supabase
      .from("chapters")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    activeChapters = count ?? 0;
  }

  const communityGatherings = await countUpcomingGatherings(supabase, { stateFilter });

  const { data: memberRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();
  const { data: leaderRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();

  let membersEngaged = 0;
  let localLeaders = 0;

  if (stateFilter) {
    const { data: chRows } = await supabase.from("chapters").select("id").eq("state", stateFilter);
    const chapterIds = (chRows ?? []).map((r: { id: string }) => r.id);
    if (chapterIds.length > 0 && memberRole) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id")
        .in("primary_chapter_id", chapterIds);
      const userIds = (profs ?? []).map((p: { id: string }) => p.id);
      if (userIds.length > 0) {
        const { data: ur } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role_id", memberRole.id as string)
          .in("user_id", userIds);
        membersEngaged = new Set((ur ?? []).map((r: { user_id: string }) => r.user_id)).size;
      }
    }
    if (chapterIds.length > 0) {
      const { data: cl } = await supabase
        .from("chapter_leaders")
        .select("user_id")
        .in("chapter_id", chapterIds);
      localLeaders = new Set((cl ?? []).map((r: { user_id: string }) => r.user_id)).size;
    }
  } else {
    if (memberRole) {
      const { count } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role_id", memberRole.id as string);
      membersEngaged = count ?? 0;
    }
    if (leaderRole) {
      const { count } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role_id", leaderRole.id as string);
      localLeaders = count ?? 0;
    }
  }

  const twentyFourHoursAgo = new Date(
    Date.now() - COMMUNITY_ACTIVITY_WINDOW_MS
  ).toISOString();
  let happeningQuery = supabase
    .from("community_activity")
    .select("id", { count: "exact", head: true })
    .gte("created_at", twentyFourHoursAgo)
    .not("feed_category", "in", `(${[...HIDDEN_COMMUNITY_FEED_CATEGORIES].join(",")})`);
  if (stateFilter) {
    happeningQuery = happeningQuery.eq("state_code", stateFilter);
  }
  const { count: happeningNow } = await happeningQuery;

  let mobilizeGroups = 0;
  let peopleInMissions = 0;
  let inviteSharers = 0;
  let inviteShares = 0;
  if (!stateFilter) {
    mobilizeGroups = await countMobilizeChapterGroups(agg);
    peopleInMissions = await countStartedMissions(agg);
    const inviteMetrics = await countInviteShareMetrics(agg);
    inviteSharers = inviteMetrics.inviteSharers;
    inviteShares = inviteMetrics.inviteShares;
  }

  const ref = opts.referenceAddition;
  if (ref && !stateFilter) {
    activeChapters += ref.leaders;
    membersEngaged += ref.members;
    localLeaders += ref.leaders;
  }

  return {
    activeChapters,
    communityGatherings,
    membersEngaged,
    localLeaders,
    happeningNow: happeningNow ?? 0,
    mobilizeGroups,
    peopleInMissions,
    inviteSharers,
    inviteShares,
  };
}

export async function loadStatePopupStats(supabase: SupabaseClient, stateCode: string) {
  const st = stateMatch(stateCode);

  const { count: churches } = await supabase
    .from("chapters")
    .select("id", { count: "exact", head: true })
    .eq("state", st)
    .eq("status", "approved");

  const { data: chRows } = await supabase.from("chapters").select("id").eq("state", st);
  const chapterIds = (chRows ?? []).map((r: { id: string }) => r.id);

  const { data: memberRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "member")
    .maybeSingle();

  const { data: localLeaderRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "local_leader")
    .maybeSingle();

  // Registered members are users whose self-declared state matches the selected
  // state (dashboard_users.state OR profiles.state). We match against both the
  // 2-letter USPS code (e.g. "CA") and the full state name (e.g. "California")
  // case-insensitively, because the free-text `state` column is not normalized.
  // We also include members whose primary_chapter_id belongs to a chapter in this
  // state, so OTP members who never set their profile state are still counted.
  // Local leaders are additionally captured via chapter_leaders rows for chapters
  // in this state, so we do not miss leaders who have not set their profile state.
  const memberIds = new Set<string>();
  const leaderIds = new Set<string>();

  const stateName = usStateByCode(st)?.name ?? null;
  const stateMatchers: string[] = [st, stateName].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );

  async function collectUserIdsByState(
    table: "dashboard_users" | "profiles"
  ): Promise<string[]> {
    if (stateMatchers.length === 0) return [];
    // PostgREST `or` filter splits on commas; any value with spaces or commas
    // must be wrapped in double quotes so the parser treats it as one token.
    const orClauses = stateMatchers.map((v) => {
      const escaped = v.replace(/"/g, '\\"');
      const quoted = /[\s,]/.test(v) ? `"${escaped}"` : escaped;
      return `state.ilike.${quoted}`;
    });
    const { data } = await supabase
      .from(table)
      .select("id")
      .or(orClauses.join(","));
    return (data ?? []).map((r: { id: string }) => r.id);
  }

  const idsFromDashboardUsers = await collectUserIdsByState("dashboard_users");
  const idsFromProfiles = await collectUserIdsByState("profiles");
  const idsByState = Array.from(
    new Set([...idsFromDashboardUsers, ...idsFromProfiles])
  );

  if (idsByState.length > 0) {
    if (memberRole) {
      const { data: ur } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", memberRole.id as string)
        .in("user_id", idsByState);
      for (const r of ur ?? []) {
        if (r.user_id) memberIds.add(r.user_id as string);
      }
    }
    if (localLeaderRole) {
      const { data: ll } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", localLeaderRole.id as string)
        .in("user_id", idsByState);
      for (const r of ll ?? []) {
        if (r.user_id) leaderIds.add(r.user_id as string);
      }
    }
  }

  // Members who never set a profile state but did pick a primary chapter in this
  // state. These would be missed by the state-based lookup above.
  if (chapterIds.length > 0 && memberRole) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id")
      .in("primary_chapter_id", chapterIds);
    const chapterUserIds = (profs ?? []).map((p: { id: string }) => p.id);
    if (chapterUserIds.length > 0) {
      const { data: ur } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", memberRole.id as string)
        .in("user_id", chapterUserIds);
      for (const r of ur ?? []) {
        if (r.user_id) memberIds.add(r.user_id as string);
      }
    }
  }

  // Also include leaders explicitly assigned to chapters in this state, even if
  // their profile.state is not set.
  if (chapterIds.length > 0) {
    const { data: cl } = await supabase
      .from("chapter_leaders")
      .select("user_id")
      .in("chapter_id", chapterIds);
    for (const r of cl ?? []) {
      if (r.user_id) leaderIds.add(r.user_id as string);
    }
  }

  const members = memberIds.size;
  const localLeaders = leaderIds.size;

  // National upcoming FPA events (not filtered by state).
  const nowIso = new Date().toISOString();
  const { count: upcomingEvents } = await supabase
    .from("gatherings")
    .select("id", { count: "exact", head: true })
    .gt("starts_at", nowIso);

  const { data: newest } = await supabase
    .from("chapters")
    .select("name, city")
    .eq("state", st)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    state: st,
    churches: churches ?? 0,
    registeredMembers: members + localLeaders,
    upcomingEvents: upcomingEvents ?? 0,
    newestChurchName: newest?.name ?? "—",
    newestChurchCity: newest?.city ?? "—",
  };
}
