import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import type { FirstMissionStepStatus } from "@/lib/onboarding/member-onboarding-status";
import {
  listAdminStaffOptions,
  loadFirstMissionsMap,
  queryOnboardingMembersPaginated,
} from "@/lib/onboarding/onboarding-records";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function parseFirstMissionStatus(raw: string | null): FirstMissionStepStatus | "all" {
  if (raw === "locked" || raw === "in_progress" || raw === "completed") return raw;
  return "all";
}

export async function GET(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isElevatedRole(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.courses, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(0, Number(url.searchParams.get("page") || 0));
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("perPage") || 25)));
  const chapterId = url.searchParams.get("chapterId") || "all";
  const state = url.searchParams.get("state") || "all";
  const q = (url.searchParams.get("q") || "").trim();
  const firstMissionStatus = parseFirstMissionStatus(url.searchParams.get("status"));

  const admin = createAdminClient();
  const { data: chapters } = await admin.from("chapters").select("id, name, state").order("name");
  const chapterOptions = (chapters ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    state: String(c.state ?? "").trim(),
  }));

  const [pageResult, adminStaff] = await Promise.all([
    queryOnboardingMembersPaginated(
      admin,
      { page, perPage, chapterId, state, q, firstMissionStatus },
      chapterOptions
    ),
    listAdminStaffOptions(admin),
  ]);

  const userIds = pageResult.rows.map((m) => m.user_id);
  const firstMissions = await loadFirstMissionsMap(admin, userIds);
  const staffById = new Map(adminStaff.map((s) => [s.id, s]));

  const rows = pageResult.rows.map((m) => {
    const record = firstMissions.get(m.user_id)!;
    const tutor = record.tutor_id ? staffById.get(record.tutor_id) : null;
    return {
      ...m,
      first_mission: {
        ...record,
        tutor_name: tutor?.label ?? null,
        tutor_email: tutor?.email ?? null,
      },
    };
  });

  return NextResponse.json({
    ok: true,
    rows,
    total: pageResult.total,
    page: pageResult.page,
    perPage: pageResult.perPage,
    adminStaff,
  });
}
