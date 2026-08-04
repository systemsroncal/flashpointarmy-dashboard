import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { canAccessMobilizeModule, loadUserRoleNames } from "@/lib/auth/user-roles";
import {
  normalizeChaptersViewerRoles,
  normalizeChaptersViewerUserIds,
} from "@/lib/auth/dashboard-user";
import { createAdminClient } from "@/utils/supabase/admin";

export type MobilizeAuthOk = {
  userId: string;
  admin: ReturnType<typeof createAdminClient>;
  roleNames: string[];
};

/**
 * Mobilize APIs: authenticate, require module access (super_admin, settings roles, or whitelist),
 * return admin client for queries.
 */
export async function requireMobilizeRead(): Promise<MobilizeAuthOk | NextResponse> {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;
  const [roleNames, settingsRes] = await Promise.all([
    loadUserRoleNames(supabase, user.id),
    supabase
      .from("mobilize_policy_settings")
      .select("chapters_viewer_roles, chapters_viewer_user_ids")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  const row = settingsRes.data as {
    chapters_viewer_roles?: unknown;
    chapters_viewer_user_ids?: unknown;
  } | null;
  const viewerRoles = normalizeChaptersViewerRoles(row?.chapters_viewer_roles);
  const viewerUserIds = normalizeChaptersViewerUserIds(row?.chapters_viewer_user_ids);
  if (
    !canAccessMobilizeModule(roleNames, viewerRoles, {
      userId: user.id,
      viewerUserIds,
    })
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return { userId: user.id, admin: createAdminClient(), roleNames };
}
