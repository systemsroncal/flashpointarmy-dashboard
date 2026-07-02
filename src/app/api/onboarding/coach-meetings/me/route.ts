import {
  coachMeetingKindForAudience,
  coachMeetingTopic,
} from "@/lib/onboarding/coach-meeting-labels";
import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";
import {
  loadCoachMeetingForUser,
  loadTrainingStepStatus,
} from "@/lib/onboarding/onboarding-records";
import { ensureCoachMeetingUnlockedAfterTraining } from "@/lib/onboarding/sync-coach-meeting-unlock";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

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

export async function POST() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnboardingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Coach meeting booking is no longer used. Complete your Mission Briefing instead." },
    { status: 403 }
  );
}
