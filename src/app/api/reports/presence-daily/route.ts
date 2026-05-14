import type { PresenceDailyPayload } from "@/lib/reports/presence-daily-payload";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const oldest = new Date(Date.UTC(y, m, d));
    oldest.setUTCDate(oldest.getUTCDate() - 6);
    const fromStr = oldest.toISOString().slice(0, 10);

    const { data, error } = await admin
      .from("dashboard_presence_daily")
      .select("day_utc, user_id")
      .gte("day_utc", fromStr);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const byDay = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const day = String((row as { day_utc: string }).day_utc).slice(0, 10);
      const uid = String((row as { user_id: string }).user_id);
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(uid);
    }

    const categories: string[] = [];
    const activeUsersByDay: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.UTC(y, m, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      const key = dt.toISOString().slice(0, 10);
      categories.push(key);
      activeUsersByDay.push(byDay.get(key)?.size ?? 0);
    }

    const payload: PresenceDailyPayload = {
      categories,
      activeUsersByDay,
      note: 'UTC days; retention keeps 7 rolling days. "Online now" uses Presence in the dashboard shell.',
    };

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
