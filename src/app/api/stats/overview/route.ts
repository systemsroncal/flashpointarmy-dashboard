import { requireApiAuth } from "@/lib/auth/server-session";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { includeReferenceInOverviewStatTotals } from "@/lib/config/reference-overview-stats";
import {
  aggregateReferenceLeaderMemberByState,
  sumReferenceTotals,
  type CitiesDonorsJson,
} from "@/lib/donors/aggregate-donors-by-state";
import { loadOverviewStats } from "@/lib/stats/overview-stats";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { createAdminClient, hasSupabaseAdminEnv } from "@/utils/supabase/admin";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const permissions = await loadModulePermissions(supabase, user.id);
  const allowed =
    can(permissions, MODULE_SLUGS.nationalOverview, "read") ||
    can(permissions, MODULE_SLUGS.dashboard, "read");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

  try {
    const aggregateSupabase = hasSupabaseAdminEnv() ? createAdminClient() : supabase;
    const stats = await loadOverviewStats(
      supabase,
      { scope: "national", stateCode: null, referenceAddition },
      aggregateSupabase
    );
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load overview stats." },
      { status: 500 }
    );
  }
}
