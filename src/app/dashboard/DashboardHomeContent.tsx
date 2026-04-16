import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { NationalOverview } from "@/components/dashboard/national-overview/NationalOverview";
import { MODULE_SLUGS } from "@/config/modules";
import type { CitiesDonorsJson } from "@/lib/donors/aggregate-donors-by-state";
import {
  aggregateReferenceLeaderMemberByState,
  sumReferenceTotals,
} from "@/lib/donors/aggregate-donors-by-state";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { loadOverviewStats } from "@/lib/stats/overview-stats";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { readFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";

export default async function DashboardHomeContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let feed: {
    id: string;
    feed_category: string;
    title: string;
    subtitle: string | null;
    state_code: string | null;
    created_at: string;
    icon_key: string | null;
  }[] = [];
  try {
    const { data } = await supabase
      .from("community_activity")
      .select("id, feed_category, title, subtitle, state_code, created_at, icon_key")
      .gte("created_at", fiveMinAgo)
      .order("created_at", { ascending: false });
    feed = (data ?? []).map((r) => ({ ...r, icon_key: r.icon_key ?? null }));
  } catch {
    feed = [];
  }

  let chapters: { id: string; name: string; state: string }[] = [];
  try {
    const { data } = await supabase.from("chapters").select("id,name,state").order("name");
    chapters = data ?? [];
  } catch {
    chapters = [];
  }

  return (
    <NationalOverview initialStats={stats} initialFeed={feed} chapters={chapters} />
  );
}
