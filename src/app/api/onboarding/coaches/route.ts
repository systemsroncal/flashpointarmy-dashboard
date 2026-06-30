import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  listAdminStaffOptions,
  type AdminStaffOption,
} from "@/lib/onboarding/onboarding-records";
import {
  listCoachAssigneeOptions,
  saveCoachAssignees,
} from "@/lib/onboarding/coach-assignees";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PutBody = {
  coach_ids?: string[];
};

export async function GET() {
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

  const admin = createAdminClient();
  const [selected, pool] = await Promise.all([
    listCoachAssigneeOptions(admin),
    listAdminStaffOptions(admin),
  ]);

  return NextResponse.json({
    ok: true,
    coaches: selected,
    coach_ids: selected.map((c) => c.id),
    pool,
  });
}

export async function PUT(req: Request) {
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

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ids = (body.coach_ids ?? []).filter((id) => UUID_RE.test(id));
  const admin = createAdminClient();
  const pool = await listAdminStaffOptions(admin);
  const poolIds = new Set(pool.map((p) => p.id));
  const validIds = ids.filter((id) => poolIds.has(id));

  await saveCoachAssignees(admin, validIds);
  const coaches = await listCoachAssigneeOptions(admin);

  return NextResponse.json({
    ok: true,
    coaches,
    coach_ids: coaches.map((c: AdminStaffOption) => c.id),
  });
}
