import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type MobilizeAuthOk = {
  userId: string;
  admin: ReturnType<typeof createAdminClient>;
};

/**
 * Mobilize APIs: authenticate, require admin / super_admin, return admin client for queries.
 */
export async function requireMobilizeRead(): Promise<MobilizeAuthOk | NextResponse> {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;
  const roleNames = await loadUserRoleNames(supabase, user.id);
  if (!canAccessMobilizeModule(roleNames)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return { userId: user.id, admin: createAdminClient() };
}
