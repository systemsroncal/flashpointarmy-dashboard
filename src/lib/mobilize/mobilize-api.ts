import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import { normalizeChaptersViewerRoles } from "@/lib/auth/dashboard-user";
import { createAdminClient } from "@/utils/supabase/admin";

export type MobilizeAuthOk = {
  userId: string;
  admin: ReturnType<typeof createAdminClient>;
  roleNames: string[];
};

/**
 * Mobilize APIs: authenticate, require module access (super_admin or settings roles),
 * return admin client for queries.
 */
export async function requireMobilizeRead(): Promise<MobilizeAuthOk | NextResponse> {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;
  const [roleNames, settingsRes] = await Promise.all([
    loadUserRoleNames(supabase, user.id),
    supabase.from("mobilize_policy_settings").select("chapters_viewer_roles").eq("id", 1).maybeSingle(),
  ]);
  const viewerRoles = normalizeChaptersViewerRoles(
    (settingsRes.data as { chapters_viewer_roles?: unknown } | null)?.chapters_viewer_roles
  );
  if (!canAccessMobilizeModule(roleNames, viewerRoles)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return { userId: user.id, admin: createAdminClient(), roleNames };
}
