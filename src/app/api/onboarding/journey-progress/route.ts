import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import {
  loadJourneyProgressStats,
  queryJourneyProgressPaginated,
  type JourneyProgressFilter,
} from "@/lib/onboarding/journey-progress-stats";
import {
  parseJourneyProgressSortAscending,
  parseJourneyProgressSortKey,
} from "@/lib/onboarding/journey-progress-table-sort";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

function parseFilter(raw: string | null | undefined): JourneyProgressFilter {
  const v = (raw ?? "all").trim();
  if (
    v === "course" ||
    v === "briefing" ||
    v === "missions" ||
    v === "all_three" ||
    v === "none"
  ) {
    return v;
  }
  return "all";
}

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const permissions = await loadModulePermissions(supabase, user.id);
  const roles = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roles) || !can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view")?.trim() || "";

  const admin = createAdminClient();

  if (view === "stats") {
    try {
      const stats = await loadJourneyProgressStats(admin);
      return NextResponse.json({ ok: true, stats });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Could not load journey stats." },
        { status: 500 }
      );
    }
  }

  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("perPage") || 25)));
  const q = (url.searchParams.get("q") || "").trim();
  const filter = parseFilter(url.searchParams.get("filter"));
  const sort = parseJourneyProgressSortKey(url.searchParams.get("sort"));
  const ascending = parseJourneyProgressSortAscending(url.searchParams.get("order"));
  const autocomplete = url.searchParams.get("autocomplete") === "1";

  try {
    const result = await queryJourneyProgressPaginated(admin, {
      page,
      perPage,
      q,
      filter,
      sort,
      ascending,
      autocomplete,
    });
    if (autocomplete) {
      return NextResponse.json({ options: result.options ?? [] });
    }
    return NextResponse.json({
      ok: true,
      rows: result.rows,
      total: result.total,
      page: result.page,
      perPage: result.perPage,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load journey progress." },
      { status: 500 }
    );
  }
}
