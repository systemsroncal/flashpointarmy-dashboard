import { MODULE_SLUGS } from "@/config/modules";
import {
  isElevatedRole,
  isSuperAdminUser,
  loadUserRoleNames,
} from "@/lib/auth/user-roles";
import type { ModulePermissionMap } from "@/types/permissions";
import { can } from "@/types/permissions";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type CommunityMemberEditAccess =
  | { ok: true; targetRoles: string[]; callerRoles: string[] }
  | { ok: false; response: NextResponse };

export async function assertCommunityMemberEditAccess(
  admin: SupabaseClient,
  callerSupabase: SupabaseClient,
  caller: User,
  permissions: ModulePermissionMap,
  targetUserId: string
): Promise<CommunityMemberEditAccess> {
  const [targetRoles, callerRoles] = await Promise.all([
    loadUserRoleNames(admin, targetUserId),
    loadUserRoleNames(callerSupabase, caller.id),
  ]);

  const targetIsAdminDirectory =
    targetRoles.includes("admin") || targetRoles.includes("super_admin");

  const canPatchCommunity =
    can(permissions, MODULE_SLUGS.community, "update") ||
    can(permissions, MODULE_SLUGS.leaders, "update");
  const canPatchAdmins = can(permissions, MODULE_SLUGS.admins, "update");

  if (targetIsAdminDirectory) {
    if (!canPatchAdmins) {
      return { ok: false, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
    }
    if (isSuperAdminUser(targetRoles) && !isSuperAdminUser(callerRoles)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Only super admins can edit super admin accounts." },
          { status: 403 }
        ),
      };
    }
  } else if (!canPatchCommunity) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  if (!targetIsAdminDirectory && !isElevatedRole(callerRoles)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { ok: true, targetRoles, callerRoles };
}
