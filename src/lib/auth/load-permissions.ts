import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emptyCrud,
  mergeCrud,
  type ModulePermissionMap,
} from "@/types/permissions";

/**
 * Loads RBAC from public.user_roles. `userId` must match public.dashboard_users.id
 * (same UUID as auth.users in Supabase).
 */

type RolePermRow = {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  modules: { slug: string } | null;
};

type UserRoleRow = {
  roles: {
    role_permissions: RolePermRow[] | null;
  } | null;
};

export async function loadModulePermissions(
  supabase: SupabaseClient,
  userId: string
): Promise<ModulePermissionMap> {
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      `
      roles (
        role_permissions (
          can_create,
          can_read,
          can_update,
          can_delete,
          modules ( slug )
        )
      )
    `
    )
    .eq("user_id", userId);

  if (error || !data) {
    return {};
  }

  const map: ModulePermissionMap = {};

  for (const row of data as unknown as UserRoleRow[]) {
    const perms = row.roles?.role_permissions;
    if (!perms) continue;
    for (const rp of perms) {
      const slug = rp.modules?.slug;
      if (!slug) continue;
      const flags = {
        create: !!rp.can_create,
        read: !!rp.can_read,
        update: !!rp.can_update,
        delete: !!rp.can_delete,
      };
      map[slug] = map[slug] ? mergeCrud(map[slug], flags) : flags;
    }
  }

  return map;
}

export function ensureModule(
  map: ModulePermissionMap,
  slug: string
): ModulePermissionMap {
  if (!map[slug]) map[slug] = emptyCrud();
  return map;
}
