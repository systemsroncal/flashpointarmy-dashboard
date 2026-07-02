import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { isMissionBriefingAudience } from "@/lib/onboarding/mission-briefing-audience";
import { startMissionBriefingForUser } from "@/lib/onboarding/sync-mission-briefing";
import { requireServerUser } from "@/lib/auth/server-session";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMissionBriefingAudience(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = createAdminClient();
  await startMissionBriefingForUser(admin, user.id, roleNames);
  return NextResponse.json({ ok: true });
}
