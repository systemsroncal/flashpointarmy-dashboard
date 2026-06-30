import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { NationalOverview } from "@/components/dashboard/national-overview/NationalOverview";
import { MODULE_SLUGS } from "@/config/modules";
import type { CitiesDonorsJson } from "@/lib/donors/aggregate-donors-by-state";
import {
  aggregateReferenceLeaderMemberByState,
  sumReferenceTotals,
} from "@/lib/donors/aggregate-donors-by-state";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { includeReferenceInOverviewStatTotals } from "@/lib/config/reference-overview-stats";
import { loadCommunityActivityFeed } from "@/lib/community/community-activity-feed";
import {
  isMemberOnboardingAudience,
  loadMemberOnboardingSnapshot,
} from "@/lib/onboarding/member-onboarding-status";
import { loadOverviewStats } from "@/lib/stats/overview-stats";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { readFile } from "fs/promises";
import path from "path";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function DashboardHomeContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  const allowed =
    can(permissions, MODULE_SLUGS.nationalOverview, "read") ||
    can(permissions, MODULE_SLUGS.dashboard, "read");

  if (!allowed) {
    return (
      <AccessDenied message="You do not have permission to view the command center. Ask an administrator." />
    );
  }

  let referenceAddition: { leaders: number; members: number } | undefined;
  if (includeReferenceInOverviewStatTotals()) {
    try {
      const raw = await readFile(
        path.join(process.cwd(), "public/backgrounds/cities_donors.json"),
        "utf8"
      );
      const json = JSON.parse(raw) as CitiesDonorsJson;
      referenceAddition = sumReferenceTotals(aggregateReferenceLeaderMemberByState(json));
    } catch {
      referenceAddition = undefined;
    }
  }

  let stats;
  try {
    stats = await loadOverviewStats(supabase, {
      scope: "national",
      stateCode: null,
      referenceAddition,
    });
  } catch {
    stats = {
      activeChapters: 0,
      communityGatherings: 0,
      membersEngaged: 0,
      localLeaders: 0,
      happeningNow: 0,
    };
  }

  let feed: Awaited<ReturnType<typeof loadCommunityActivityFeed>> = [];
  try {
    feed = await loadCommunityActivityFeed(supabase);
  } catch {
    feed = [];
  }

  let chapters: { id: string; name: string; state: string }[] = [];
  try {
    const { data } = await supabase
      .from("chapters")
      .select("id,name,state,status")
      .eq("status", "approved")
      .order("name");
    chapters = data ?? [];
  } catch {
    chapters = [];
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  let memberOnboarding = null;
  if (isMemberOnboardingAudience(roleNames)) {
    try {
      memberOnboarding = await loadMemberOnboardingSnapshot(supabase, user.id, roleNames);
    } catch {
      memberOnboarding = null;
    }
  }

  return (
    <NationalOverview
      initialStats={stats}
      initialFeed={feed}
      chapters={chapters}
      memberOnboarding={memberOnboarding}
    />
  );
}
