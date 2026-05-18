import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import {
  buildSeriesForTimestamps,
  parseRange,
  suggestBucket,
  type DateBucket,
} from "@/lib/reports/bucket-series";
import { fetchCreatedAtInRange } from "@/lib/reports/fetch-created-at-range";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

function isBucket(v: string | null): v is DateBucket {
  return v === "day" || v === "month" || v === "year";
}

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.reports, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const { from, to } = parseRange(url.searchParams.get("from"), url.searchParams.get("to"));
    const bucketParam = url.searchParams.get("bucket");
    const bucket: DateBucket = isBucket(bucketParam) ? bucketParam : suggestBucket(from, to);

    const admin = createAdminClient();
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const [userDates, chapterDates, gatheringDates, roleRes, chapterStatusRes] = await Promise.all([
      fetchCreatedAtInRange(admin, "dashboard_users", fromIso, toIso),
      fetchCreatedAtInRange(admin, "chapters", fromIso, toIso),
      fetchCreatedAtInRange(admin, "gatherings", fromIso, toIso),
      admin.from("user_roles").select("roles(name)"),
      admin.from("chapters").select("status"),
    ]);

    const firstErr = roleRes.error || chapterStatusRes.error;
    if (firstErr) {
      return NextResponse.json({ error: firstErr.message }, { status: 400 });
    }

    const usersByBucket = buildSeriesForTimestamps(userDates, from, to, bucket);
    const chaptersByBucket = buildSeriesForTimestamps(chapterDates, from, to, bucket);
    const gatheringsByBucket = buildSeriesForTimestamps(gatheringDates, from, to, bucket);

    const roleCounts = new Map<string, number>();
    for (const row of roleRes.data ?? []) {
      const rel = (row as { roles: { name: string } | { name: string }[] | null }).roles;
      const name = Array.isArray(rel) ? rel[0]?.name : rel?.name;
      if (!name) continue;
      roleCounts.set(name, (roleCounts.get(name) ?? 0) + 1);
    }

    const chapterStatusCounts = new Map<string, number>();
    for (const row of chapterStatusRes.data ?? []) {
      const st = (row as { status: string }).status || "unknown";
      chapterStatusCounts.set(st, (chapterStatusCounts.get(st) ?? 0) + 1);
    }

    return NextResponse.json({
      range: { from: fromIso, to: toIso },
      bucket,
      usersByBucket,
      chaptersByBucket,
      gatheringsByBucket,
      rolesPie: {
        labels: [...roleCounts.keys()],
        series: [...roleCounts.values()],
      },
      chapterStatusPie: {
        labels: [...chapterStatusCounts.keys()],
        series: [...chapterStatusCounts.values()],
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
