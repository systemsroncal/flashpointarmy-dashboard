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
    await completeMissionBriefingForUser(admin, user.id, roleNames);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not complete Mission Briefing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
