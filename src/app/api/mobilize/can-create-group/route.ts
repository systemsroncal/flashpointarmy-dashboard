import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { canCreateMobilizeGroup, loadMobilizeGroupCreatorPolicy } from "@/lib/mobilize/mobilize-roles";
import { requireMobilizeRead } from "@/lib/mobilize/mobilize-api";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const auth = await requireMobilizeRead();
  if (auth instanceof NextResponse) return auth;
  const supabase = await createClient();
  const roleNames = await loadUserRoleNames(supabase, auth.userId);
  const policy = await loadMobilizeGroupCreatorPolicy(auth.admin);
  return NextResponse.json({ canCreate: canCreateMobilizeGroup(roleNames, policy) });
}
