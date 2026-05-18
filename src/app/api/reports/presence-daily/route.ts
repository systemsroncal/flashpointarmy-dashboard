import {
  PRESENCE_REPORT_DAYS,
  type PresenceDailyPayload,
  type PresenceDemographicRow,
} from "@/lib/reports/presence-daily-payload";
import { chunkIdsForInQuery } from "@/lib/admin/dashboard-user-queries";
import { normalizeUserStateForReports } from "@/lib/reports/normalize-user-state";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import type { SupabaseClient } from "@supabase/supabase-js";

const DAY_COUNT = PRESENCE_REPORT_DAYS;

function utcTodayParts(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  return { y, m, d };
}

function utcDateKey(y: number, m: number, d: number, offsetDays: number): string {
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

type PresenceRow = { day_utc: string; user_id: string };

const PRESENCE_PAGE = 1000;
const DEMOGRAPHICS_IN_CHUNK = 100;

/** PostgREST returns at most ~1000 rows per request unless paginated; long `.in()` lists also break proxies. */
async function fetchAllPresenceRowsSince(
  admin: SupabaseClient,
  fromStr: string
): Promise<{ rows: PresenceRow[]; errorMessage: string | null }> {
  const rows: PresenceRow[] = [];
  for (let from = 0; ; from += PRESENCE_PAGE) {
    const to = from + PRESENCE_PAGE - 1;
    const { data, error } = await admin
      .from("dashboard_presence_daily")
      .select("day_utc, user_id")
      .gte("day_utc", fromStr)
      .order("day_utc", { ascending: true })
      .order("user_id", { ascending: true })
      .range(from, to);
    if (error) return { rows, errorMessage: error.message };
    const batch = (data ?? []) as PresenceRow[];
    rows.push(...batch);
    if (batch.length < PRESENCE_PAGE) break;
  }
  return { rows, errorMessage: null };
}

export async function GET() {
  try {
    const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.reports, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { y, m, d } = utcTodayParts();
    const fromStr = utcDateKey(y, m, d, -(DAY_COUNT - 1));
    const todayKey = utcDateKey(y, m, d, 0);
    const yesterdayKey = utcDateKey(y, m, d, -1);

    const registrationsFrom = new Date(Date.UTC(y, m, d));
    registrationsFrom.setUTCDate(registrationsFrom.getUTCDate() - (DAY_COUNT - 1));

    const { rows: presenceRows, errorMessage: presenceErr } = await fetchAllPresenceRowsSince(admin, fromStr);
    if (presenceErr) {
      return NextResponse.json({ error: presenceErr }, { status: 400 });
    }

    const registrationsRes = await admin
      .from("dashboard_users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", registrationsFrom.toISOString());

    const byDay = new Map<string, Set<string>>();
    const activeUserIds = new Set<string>();
    for (const row of presenceRows) {
      const day = String((row as { day_utc: string }).day_utc).slice(0, 10);
      const uid = String((row as { user_id: string }).user_id);
      activeUserIds.add(uid);
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(uid);
    }

    const categories: string[] = [];
    const activeUsersByDay: number[] = [];
    for (let i = DAY_COUNT - 1; i >= 0; i--) {
      const key = utcDateKey(y, m, d, -i);
      categories.push(key);
      activeUsersByDay.push(byDay.get(key)?.size ?? 0);
    }

    const activeToday = byDay.get(todayKey)?.size ?? 0;
    const activeYesterday = byDay.get(yesterdayKey)?.size ?? 0;
    let peakDayCount = 0;
    let peakDayLabel = todayKey;
    for (let i = 0; i < categories.length; i++) {
      const n = activeUsersByDay[i] ?? 0;
      if (n >= peakDayCount) {
        peakDayCount = n;
        peakDayLabel = categories[i]!;
      }
    }

    const todayVsYesterdayPercent =
      activeYesterday > 0
        ? Math.round(((activeToday - activeYesterday) / activeYesterday) * 1000) / 10
        : activeToday > 0
          ? 100
          : null;

    let demographicsByState: PresenceDemographicRow[] = [];
    if (activeUserIds.size > 0) {
      const ids = [...activeUserIds];
      const byState = new Map<string, number>();
      for (const part of chunkIdsForInQuery(ids, DEMOGRAPHICS_IN_CHUNK)) {
        const { data: users, error: usersErr } = await admin
          .from("dashboard_users")
          .select("id, state")
          .in("id", part);
        if (usersErr) {
          return NextResponse.json({ error: usersErr.message }, { status: 400 });
        }
        for (const u of users ?? []) {
          const st = normalizeUserStateForReports((u as { state: string | null }).state);
          byState.set(st, (byState.get(st) ?? 0) + 1);
        }
      }
      const total = activeUserIds.size;
      demographicsByState = [...byState.entries()]
        .map(([state, activeUsers]) => ({
          state,
          activeUsers,
          percent: total > 0 ? Math.round((activeUsers / total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.activeUsers - a.activeUsers);
    }

    const payload: PresenceDailyPayload = {
      categories,
      activeUsersByDay,
      summary: {
        activeToday,
        activeYesterday,
        distinctLast30Days: activeUserIds.size,
        registrationsLast30Days: registrationsRes.error ? 0 : (registrationsRes.count ?? 0),
        peakDayCount,
        peakDayLabel,
        todayVsYesterdayPercent,
      },
      demographicsByState,
      note: `UTC calendar days; retention keeps ${DAY_COUNT} rolling days. "Online now" uses Realtime Presence in the dashboard shell. Demographics group active users in this window by profile state.`,
    };

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
