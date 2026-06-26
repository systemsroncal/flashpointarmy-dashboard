import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import type { CoachMeetingStepStatus } from "@/lib/onboarding/member-onboarding-status";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES: CoachMeetingStepStatus[] = ["pending", "in_progress", "completed"];

type PatchBody = {
  status?: CoachMeetingStepStatus;
  coach_id?: string | null;
  coaching_at?: string | null;
  description?: string | null;
  observations?: string | null;
};

export async function PATCH(req: Request, ctx: { params: Promise<{ userId: string }> }) {
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

  const { userId } = await ctx.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (body.coach_id != null && body.coach_id !== "" && !UUID_RE.test(body.coach_id)) {
    return NextResponse.json({ error: "Invalid coach id." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const patch = {
    user_id: userId,
    status: body.status ?? "pending",
    coach_id: body.coach_id || null,
    coaching_at: body.coaching_at?.trim() || null,
    description: body.description?.trim() || null,
    observations: body.observations?.trim() || null,
    updated_by: user.id,
    updated_at: now,
  };

  const { data, error } = await admin
    .from("member_coach_meetings")
    .upsert(patch, { onConflict: "user_id" })
    .select("user_id, status, coach_id, coaching_at, description, observations, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: data });
}
