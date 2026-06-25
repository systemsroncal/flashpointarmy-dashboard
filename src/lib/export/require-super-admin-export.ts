import { isSuperAdminUser, loadUserRoleNames } from "@/lib/auth/user-roles";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Excel exports and bulk import/sync are restricted to platform super admins. */
export async function assertSuperAdminExportAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const roleNames = await loadUserRoleNames(supabase, userId);
  if (!isSuperAdminUser(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return null;
}
