import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { isMissionBriefingAudience } from "@/lib/onboarding/mission-briefing-audience";
import { loadMissionBriefingProgress } from "@/lib/onboarding/mission-briefing";
import { loadCoachMeetingForUser } from "@/lib/onboarding/onboarding-records";
import { requireServerUser } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMissionBriefingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [progress, coachRow] = await Promise.all([
    loadMissionBriefingProgress(supabase, user.id),
    loadCoachMeetingForUser(supabase, user.id),
  ]);

  return NextResponse.json({
    progress: progress ?? {
      user_id: user.id,
      video_position_seconds: 0,
      video_duration_seconds: null,
      updated_at: null,
    },
    stepStatus: coachRow.status,
  });
}
