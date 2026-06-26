import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  listAdminStaffOptions,
  loadCoachMeetingsMap,
  loadOnboardingMemberRows,
} from "@/lib/onboarding/onboarding-records";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

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
  const [members, adminStaff] = await Promise.all([
    loadOnboardingMemberRows(admin),
    listAdminStaffOptions(admin),
  ]);
  const userIds = members.map((m) => m.user_id);
  const coachMeetings = await loadCoachMeetingsMap(admin, userIds);
  const staffById = new Map(adminStaff.map((s) => [s.id, s]));

  const rows = members.map((m) => {
    const record = coachMeetings.get(m.user_id)!;
    const coach = record.coach_id ? staffById.get(record.coach_id) : null;
    return {
      ...m,
      coach_meeting: {
        ...record,
        coach_name: coach?.label ?? null,
        coach_email: coach?.email ?? null,
      },
    };
  });

  return NextResponse.json({ ok: true, rows, adminStaff });
}
