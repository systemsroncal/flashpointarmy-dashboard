import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { completeMissionBriefingForUser } from "@/lib/onboarding/sync-mission-briefing";
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

  const { data: row } = await supabase
    .from("member_coach_meetings")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row || row.status === "locked") {
    return NextResponse.json({ error: "Complete Biblical Citizenship first." }, { status: 403 });
  }
  if (row.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  await completeMissionBriefingForUser(supabase, user.id);
  return NextResponse.json({ ok: true });
}
