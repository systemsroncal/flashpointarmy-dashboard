import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  defaultWeekComparisonRanges,
  formatUsDateRange,
  validateRegistrationComparisonInput,
  ymdToRange,
} from "@/lib/reports/registration-comparison";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";

async function countUsersRegistered(
  admin: ReturnType<typeof createAdminClient>,
  fromIso: string,
  toIso: string
) {
  const { count, error } = await admin
    .from("dashboard_users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function GET(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { supabase, user } = authResult;

    const permissions = await loadModulePermissions(supabase, user.id);
    const roleNames = await loadUserRoleNames(supabase, user.id);
    if (!roleNames.includes("super_admin") || !can(permissions, MODULE_SLUGS.reports, "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const preset = url.searchParams.get("preset") === "custom" ? "custom" : "week";

    let beforeFrom: string;
    let beforeTo: string;
    let afterFrom: string;
    let afterTo: string;

    if (preset === "week") {
      const ranges = defaultWeekComparisonRanges();
      beforeFrom = ranges.before.from;
      beforeTo = ranges.before.to;
      afterFrom = ranges.after.from;
      afterTo = ranges.after.to;
    } else {
      beforeFrom = url.searchParams.get("beforeFrom") ?? "";
      beforeTo = url.searchParams.get("beforeTo") ?? "";
      afterFrom = url.searchParams.get("afterFrom") ?? "";
      afterTo = url.searchParams.get("afterTo") ?? "";
    }

    const validationError = validateRegistrationComparisonInput({
      beforeFrom,
      beforeTo,
      afterFrom,
      afterTo,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const before = ymdToRange(beforeFrom, beforeTo);
    const after = ymdToRange(afterFrom, afterTo);

    const admin = createAdminClient();
    const [beforeCount, afterCount] = await Promise.all([
      countUsersRegistered(admin, before.fromIso, before.toIso),
      countUsersRegistered(admin, after.fromIso, after.toIso),
    ]);

    const delta = afterCount - beforeCount;
    const percentChange =
      beforeCount > 0
        ? Math.round(((afterCount - beforeCount) / beforeCount) * 100)
        : afterCount > 0
          ? 100
          : 0;

    return NextResponse.json({
      preset,
      before: {
        from: before.from,
        to: before.to,
        label: formatUsDateRange(before.from, before.to),
        count: beforeCount,
      },
      after: {
        from: after.from,
        to: after.to,
        label: formatUsDateRange(after.from, after.to),
        count: afterCount,
      },
      delta,
      percentChange,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load registration comparison" },
      { status: 500 }
    );
  }
}
