import {
  coachMeetingKindForAudience,
  coachMeetingTopic,
} from "@/lib/onboarding/coach-meeting-labels";
import {
  addMinutesIso,
  composeCoachingAtIso,
  COACH_MEETING_DURATION_MINUTES,
  isSlotOccupied,
} from "@/lib/coach-meeting/booking";
import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";
import {
  loadCoachMeetingForUser,
  loadTrainingStepStatus,
} from "@/lib/onboarding/onboarding-records";
import { ensureCoachMeetingUnlockedAfterTraining } from "@/lib/onboarding/sync-coach-meeting-unlock";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

type BookBody = {
  date?: string;
  timeSlot?: string;
  description?: string | null;
};

export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnboardingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await ensureCoachMeetingUnlockedAfterTraining(supabase, user.id, roleNames);
  const record = await loadCoachMeetingForUser(supabase, user.id);
  const training = await loadTrainingStepStatus(supabase, user.id);

  return NextResponse.json({
    ok: true,
    record,
    training,
    audience: roleNames.includes("local_leader") ? "local_leader" : "member",
  });
}

export async function POST(req: Request) {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnboardingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (roleNames.includes("member") && !roleNames.includes("local_leader")) {
    return NextResponse.json(
      { error: "Members complete Mission Briefing instead of booking a call." },
      { status: 403 }
    );
  }

  const training = await loadTrainingStepStatus(supabase, user.id);
  if (training !== "completed") {
    return NextResponse.json(
      { error: "Complete Biblical Citizenship before scheduling." },
      { status: 403 }
    );
  }

  let body: BookBody;
  try {
    body = (await req.json()) as BookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const date = body.date?.trim() ?? "";
  const timeSlot = body.timeSlot?.trim() ?? "";
  if (!date || !timeSlot) {
    return NextResponse.json({ error: "Date and time are required." }, { status: 400 });
  }

  const coachingAt = composeCoachingAtIso(date, timeSlot);
  if (!coachingAt) {
    return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
  }

  if (new Date(coachingAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Cannot book a time in the past." }, { status: 400 });
  }

  const audience = roleNames.includes("local_leader") ? "local_leader" : "member";
  const meetingType = coachMeetingKindForAudience(audience);
  const topic = coachMeetingTopic(audience);
  const endsAt = addMinutesIso(coachingAt, COACH_MEETING_DURATION_MINUTES);
  const now = new Date().toISOString();

  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("member_coach_meetings")
    .select("user_id, coaching_at, ends_at, duration_minutes")
    .not("coaching_at", "is", null)
    .in("status", ["pending", "in_progress", "completed"]);

  if (
    isSlotOccupied(
      coachingAt,
      COACH_MEETING_DURATION_MINUTES,
      (bookings ?? []).map((row) => ({
        user_id: row.user_id as string,
        coaching_at: row.coaching_at as string,
        ends_at: (row.ends_at as string | null) ?? null,
        duration_minutes: (row.duration_minutes as number | null) ?? COACH_MEETING_DURATION_MINUTES,
      })),
      user.id
    )
  ) {
    return NextResponse.json({ error: "That time slot is already occupied." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("member_coach_meetings")
    .upsert(
      {
        user_id: user.id,
        status: "in_progress",
        meeting_type: meetingType,
        topic,
        coaching_at: coachingAt,
        ends_at: endsAt,
        duration_minutes: COACH_MEETING_DURATION_MINUTES,
        description: body.description?.trim() || null,
        updated_at: now,
      },
      { onConflict: "user_id" }
    )
    .select(
      "user_id, status, coach_id, coaching_at, ends_at, duration_minutes, meeting_type, topic, description, observations, updated_at"
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: data });
}
