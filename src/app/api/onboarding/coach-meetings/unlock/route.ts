import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";
import { ensureCoachMeetingUnlockedAfterTraining } from "@/lib/onboarding/sync-coach-meeting-unlock";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { requireApiAuth } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function POST() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;

  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnboardingAudience(roleNames)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await ensureCoachMeetingUnlockedAfterTraining(supabase, user.id, roleNames);
  return NextResponse.json({ ok: true });
}
