import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  canCreateMobilizeGroup,
  loadLocalLeaderVerified,
  loadMobilizeGroupCreatorPolicy,
} from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  const localLeaderVerified = roleNames.includes("local_leader")
    ? await loadLocalLeaderVerified(auth.admin, auth.userId)
    : false;
  return NextResponse.json({
    canCreate: canCreateMobilizeGroup(roleNames, policy, {
      creatingChapter: false,
      localLeaderVerified,
    }),
    canCreateChapter: canCreateMobilizeGroup(roleNames, policy, {
      creatingChapter: true,
      localLeaderVerified,
    }),
  });
}
