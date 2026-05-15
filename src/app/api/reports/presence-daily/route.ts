import {
  PRESENCE_REPORT_DAYS,
  type PresenceDailyPayload,
  type PresenceDemographicRow,
} from "@/lib/reports/presence-daily-payload";
import { normalizeUserStateForReports } from "@/lib/reports/normalize-user-state";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const [presenceRes, registrationsRes] = await Promise.all([
      admin.from("dashboard_presence_daily").select("day_utc, user_id").gte("day_utc", fromStr),
      admin
        .from("dashboard_users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", registrationsFrom.toISOString()),
    ]);

    if (presenceRes.error) {
      return NextResponse.json({ error: presenceRes.error.message }, { status: 400 });
    }

    const byDay = new Map<string, Set<string>>();
    const activeUserIds = new Set<string>();
    for (const row of presenceRes.data ?? []) {
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
      const { data: users, error: usersErr } = await admin
        .from("dashboard_users")
        .select("id, state")
        .in("id", ids);
      if (usersErr) {
        return NextResponse.json({ error: usersErr.message }, { status: 400 });
      }
      const byState = new Map<string, number>();
      for (const u of users ?? []) {
        const st = normalizeUserStateForReports((u as { state: string | null }).state);
        byState.set(st, (byState.get(st) ?? 0) + 1);
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
        registrationsLast30Days: registrationsRes.count ?? 0,
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
