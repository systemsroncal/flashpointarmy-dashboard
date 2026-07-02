import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { startMissionBriefingForUser } from "@/lib/onboarding/sync-mission-briefing";
import { requireServerUser } from "@/lib/auth/server-session";
import { NextResponse } from "next/server";

function isMemberOnly(roleNames: string[]): boolean {
  return roleNames.includes("member") && !roleNames.includes("local_leader");
}

export async function POST() {
  const { supabase, user } = await requireServerUser();
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!isMemberOnly(roleNames)) {
    return NextResponse.json({ error: "Mission Briefing is for members only." }, { status: 403 });
  }

  await startMissionBriefingForUser(supabase, user.id);
  return NextResponse.json({ ok: true });
}
