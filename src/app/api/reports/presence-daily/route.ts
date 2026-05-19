import {
  parsePresenceDateRange,
  utcDateKey,
  utcDayKeysInclusive,
  utcTodayParts,
} from "@/lib/reports/presence-range";
import {
  cityDisplayLabel,
  normalizeUserCityForReports,
} from "@/lib/reports/normalize-user-city";
import {
  type PresenceCityDemographicRow,
  type PresenceDailyPayload,
  type PresenceDemographicRow,
} from "@/lib/reports/presence-daily-payload";
import { resolveCityCoordinates } from "@/lib/reports/us-city-coordinates";
import { chunkIdsForInQuery } from "@/lib/admin/dashboard-user-queries";
import {
  normalizeUserStateForReports,
  stateDisplayNameForReports,
} from "@/lib/reports/normalize-user-state";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type PresenceRow = { day_utc: string; user_id: string };

const PRESENCE_PAGE = 1000;
const DEMOGRAPHICS_IN_CHUNK = 100;

async function fetchPresenceRowsInRange(
  admin: SupabaseClient,
  fromStr: string,
  toStr: string
): Promise<{ rows: PresenceRow[]; errorMessage: string | null }> {
  const rows: PresenceRow[] = [];
  for (let from = 0; ; from += PRESENCE_PAGE) {
    const to = from + PRESENCE_PAGE - 1;
    const { data, error } = await admin
      .from("dashboard_presence_daily")
      .select("day_utc, user_id")
      .gte("day_utc", fromStr)
      .lte("day_utc", toStr)
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

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    if (!can(permissions, MODULE_SLUGS.reports, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const range = parsePresenceDateRange(new URL(req.url).searchParams);
    const admin = createAdminClient();
    const { y, m, d } = utcTodayParts();
    const todayKey = utcDateKey(y, m, d, 0);
    const yesterdayKey = utcDateKey(y, m, d, -1);

    const registrationsFrom = new Date(`${range.fromStr}T00:00:00.000Z`);
    const registrationsTo = new Date(`${range.toStr}T23:59:59.999Z`);

    const { rows: presenceRows, errorMessage: presenceErr } =
      await fetchPresenceRowsInRange(admin, range.fromStr, range.toStr);
    if (presenceErr) {
      return NextResponse.json({ error: presenceErr }, { status: 400 });
    }

    const registrationsRes = await admin
      .from("dashboard_users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", registrationsFrom.toISOString())
      .lte("created_at", registrationsTo.toISOString());

    const byDay = new Map<string, Set<string>>();
    const activeUserIds = new Set<string>();
    for (const row of presenceRows) {
      const day = String(row.day_utc).slice(0, 10);
      const uid = String(row.user_id);
      activeUserIds.add(uid);
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(uid);
    }

    const categories = utcDayKeysInclusive(range.fromStr, range.toStr);
    const activeUsersByDay = categories.map((key) => byDay.get(key)?.size ?? 0);

    const activeToday = byDay.get(todayKey)?.size ?? 0;
    const activeYesterday = byDay.get(yesterdayKey)?.size ?? 0;
    let peakDayCount = 0;
    let peakDayLabel = range.toStr;
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
    let demographicsByCity: PresenceCityDemographicRow[] = [];
    if (activeUserIds.size > 0) {
      const ids = [...activeUserIds];
      const byState = new Map<string, number>();
      const byCity = new Map<string, { city: string; state: string; count: number }>();
      for (const part of chunkIdsForInQuery(ids, DEMOGRAPHICS_IN_CHUNK)) {
        const { data: users, error: usersErr } = await admin
          .from("dashboard_users")
          .select("id, state, city")
          .in("id", part);
        if (usersErr) {
          return NextResponse.json({ error: usersErr.message }, { status: 400 });
        }
        for (const u of users ?? []) {
          const row = u as { state: string | null; city: string | null };
          const st = normalizeUserStateForReports(row.state);
          byState.set(st, (byState.get(st) ?? 0) + 1);

          const city = normalizeUserCityForReports(row.city);
          const cityKey = `${city}|${st}`;
          const cur = byCity.get(cityKey);
          if (cur) cur.count += 1;
          else byCity.set(cityKey, { city, state: st, count: 1 });
        }
      }
      const total = activeUserIds.size;
      demographicsByState = [...byState.entries()]
        .map(([state, activeUsers]) => ({
          state,
          stateName: stateDisplayNameForReports(state),
          activeUsers,
          percent: total > 0 ? Math.round((activeUsers / total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.activeUsers - a.activeUsers);

      demographicsByCity = [...byCity.values()]
        .map(({ city, state, count }) => {
          const coords =
            state !== "Unknown"
              ? resolveCityCoordinates(city, state)
              : null;
          if (!coords) return null;
          const stateName = stateDisplayNameForReports(state);
          const displayCity = cityDisplayLabel(city);
          return {
            city: displayCity,
            state,
            stateName,
            label: `${displayCity}, ${state}`,
            activeUsers: count,
            percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
            lng: coords.lng,
            lat: coords.lat,
          };
        })
        .filter((row): row is PresenceCityDemographicRow => row != null)
        .sort((a, b) => b.activeUsers - a.activeUsers);
    }

    const payload: PresenceDailyPayload = {
      range: {
        preset: range.preset,
        from: range.fromStr,
        to: range.toStr,
        dayCount: range.dayCount,
      },
      categories,
      activeUsersByDay,
      summary: {
        activeToday,
        activeYesterday,
        distinctInRange: activeUserIds.size,
        registrationsInRange: registrationsRes.error ? 0 : (registrationsRes.count ?? 0),
        peakDayCount,
        peakDayLabel,
        todayVsYesterdayPercent,
      },
      demographicsByState,
      demographicsByCity,
      note: `UTC calendar days (${range.fromStr} → ${range.toStr}). "Online now" uses Realtime Presence. State and city breakdowns use profile location for users with at least one session pulse in this window.`,
    };

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
