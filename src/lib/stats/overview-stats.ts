import type { SupabaseClient } from "@supabase/supabase-js";

export type OverviewScope = "national" | "state";

export type OverviewStatBlock = {
  activeChapters: number;
  communityGatherings: number;
  membersEngaged: number;
  localLeaders: number;
  happeningNow: number;
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

export async function loadOverviewStats(
  supabase: SupabaseClient,
  opts: {
    scope: OverviewScope;
    stateCode: string | null;
    /** Added to membersEngaged (members) and localLeaders (leaders) for national overview. */
    referenceAddition?: ReferenceAddition | null;
  }
): Promise<OverviewStatBlock> {
  const st = opts.stateCode ? stateMatch(opts.stateCode) : null;
  const stateFilter = opts.scope === "state" ? st : null;

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

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let happeningQuery = supabase
    .from("community_activity")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fiveMinAgo);
  if (stateFilter) {
    happeningQuery = happeningQuery.eq("state_code", stateFilter);
  }
  const { count: happeningNow } = await happeningQuery;

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
  };
}

export async function loadStatePopupStats(supabase: SupabaseClient, stateCode: string) {
  const st = stateMatch(stateCode);
  const { count: activeChapters } = await supabase
    .from("chapters")
    .select("id", { count: "exact", head: true })
    .eq("state", st)
    .eq("status", "approved");

  const { data: chRows } = await supabase.from("chapters").select("id").eq("state", st);
  const chapterIds = (chRows ?? []).map((r: { id: string }) => r.id);

  let registeredMembers = 0;
  if (chapterIds.length > 0) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("primary_chapter_id", chapterIds);
    registeredMembers = count ?? 0;
  }

  const nowIso = new Date().toISOString();
  let upcomingGatherings = 0;
  if (chapterIds.length > 0) {
    const { count } = await supabase
      .from("gatherings")
      .select("id", { count: "exact", head: true })
      .gt("starts_at", nowIso)
      .in("chapter_id", chapterIds);
    upcomingGatherings = count ?? 0;
  }

  let localLeaders = 0;
  if (chapterIds.length > 0) {
    const { data: cl } = await supabase
      .from("chapter_leaders")
      .select("user_id")
      .in("chapter_id", chapterIds);
    localLeaders = new Set((cl ?? []).map((r: { user_id: string }) => r.user_id)).size;
  }

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let recentCommunityEvents = 0;
  if (chapterIds.length > 0) {
    const { count } = await supabase
      .from("gatherings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthAgo)
      .in("chapter_id", chapterIds);
    recentCommunityEvents = count ?? 0;
  }

  const { data: newest } = await supabase
    .from("chapters")
    .select("name, city, updated_at")
    .eq("state", st)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    state: st,
    activeChapters: activeChapters ?? 0,
    registeredMembers,
    upcomingGatherings,
    localLeaders,
    recentCommunityEvents,
    newestChapterName: newest?.name ?? "—",
    newestChapterCity: newest?.city ?? "—",
    lastActivity: newest?.updated_at ?? null,
  };
}
