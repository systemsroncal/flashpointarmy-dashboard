import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  addMinutesIso,
  COACH_MEETING_DURATION_MINUTES,
} from "@/lib/coach-meeting/booking";
import type { CoachMeetingStepStatus } from "@/lib/onboarding/member-onboarding-status";
import { unlockFirstMissionAfterCoachMeetingCompleted } from "@/lib/onboarding/sync-coach-meeting-unlock";
import { can } from "@/types/permissions";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES: CoachMeetingStepStatus[] = ["locked", "pending", "in_progress", "completed"];

type PatchBody = {
  status?: CoachMeetingStepStatus;
  coach_id?: string | null;
  coaching_at?: string | null;
  duration_minutes?: number;
  meeting_type?: "coach_meeting" | "onboarding_call";
  topic?: string | null;
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

  if (body.meeting_type && body.meeting_type !== "coach_meeting" && body.meeting_type !== "onboarding_call") {
    return NextResponse.json({ error: "Invalid meeting type." }, { status: 400 });
  }

  const durationMinutes = body.duration_minutes ?? COACH_MEETING_DURATION_MINUTES;
  if (durationMinutes <= 0 || durationMinutes > 240) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  const coachingAt = body.coaching_at?.trim() || null;
  const endsAt = coachingAt ? addMinutesIso(coachingAt, durationMinutes) : null;
  const now = new Date().toISOString();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("member_coach_meetings")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  const patch: Record<string, unknown> = {
    user_id: userId,
    updated_by: user.id,
    updated_at: now,
  };

  if (body.status !== undefined) patch.status = body.status;
  else if (!existing) patch.status = "pending";

  if (body.coach_id !== undefined) patch.coach_id = body.coach_id || null;
  if (body.coaching_at !== undefined) {
    patch.coaching_at = coachingAt;
    patch.ends_at = endsAt;
  }
  if (body.duration_minutes !== undefined) {
    patch.duration_minutes = durationMinutes;
    if (coachingAt) patch.ends_at = endsAt;
  }
  if (body.meeting_type !== undefined) patch.meeting_type = body.meeting_type;
  if (body.topic !== undefined) patch.topic = body.topic?.trim() || null;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.observations !== undefined) patch.observations = body.observations?.trim() || null;

  const { data, error } = await admin
    .from("member_coach_meetings")
    .upsert(patch, { onConflict: "user_id" })
    .select(
      "user_id, status, coach_id, coaching_at, ends_at, duration_minutes, meeting_type, topic, description, observations, updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "completed") {
    await unlockFirstMissionAfterCoachMeetingCompleted(admin, userId, user.id);
  }

  return NextResponse.json({ ok: true, record: data });
}
