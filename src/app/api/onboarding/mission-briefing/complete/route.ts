import { insertJourneyActivity } from "@/lib/community/journey-feed";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { isMissionBriefingAudience } from "@/lib/onboarding/mission-briefing-audience";
import { loadTrainingStepStatus } from "@/lib/onboarding/onboarding-records";
import { completeMissionBriefingForUser } from "@/lib/onboarding/sync-mission-briefing";
import { requireServerUser } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMissionBriefingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const training = await loadTrainingStepStatus(supabase, user.id);
  if (training !== "completed") {
    return NextResponse.json({ error: "Complete Biblical Citizenship first." }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    const { data: before } = await admin
      .from("member_coach_meetings")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    const wasCompleted = before?.status === "completed";

    await completeMissionBriefingForUser(admin, user.id, roleNames);

    if (!wasCompleted) {
      try {
        await insertJourneyActivity({
          supabase: admin,
          userId: user.id,
          kind: "mission_briefing_completed",
        });
      } catch {
        /* non-blocking */
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not complete Mission Briefing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
