import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type MobilizeAuthOk = {
  userId: string;
  admin: ReturnType<typeof createAdminClient>;
};

/**
 * Mobilize APIs: authenticate, require `movilization` read (nav access), return admin client for queries.
 */
export async function requireMobilizeRead(): Promise<MobilizeAuthOk | NextResponse> {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;
  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.movilization, "read")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return { userId: user.id, admin: createAdminClient() };
}
