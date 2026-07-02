import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadMissionBriefingProgress } from "@/lib/onboarding/mission-briefing";
import { loadCoachMeetingForUser } from "@/lib/onboarding/onboarding-records";
import { requireServerUser } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function isMemberOnly(roleNames: string[]): boolean {
  return roleNames.includes("member") && !roleNames.includes("local_leader");
}

export async function GET() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnly(roleNames)) {
    return NextResponse.json({ error: "Mission Briefing is for members only." }, { status: 403 });
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
