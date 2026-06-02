import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { isElevatedRole, loadUserRoleNames } from "@/lib/auth/user-roles";
import { can } from "@/types/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireBroadcastManage(
  supabase: SupabaseClient,
  userId: string,
  action: "read" | "create" | "update" | "delete"
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const permissions = await loadModulePermissions(supabase, userId);
  if (!can(permissions, MODULE_SLUGS.communications, action === "read" ? "read" : "create")) {
    const roleNames = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId);
    const names = (roleNames.data ?? [])
      .map((r) => (r.roles as { name?: string } | null)?.name)
      .filter(Boolean) as string[];
    if (action === "read" && isElevatedRole(names)) {
      return { ok: true };
    }
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}

export async function requireBroadcastSend(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const permissions = await loadModulePermissions(supabase, userId);
  const roleNames = await loadUserRoleNames(supabase, userId);
  if (isElevatedRole(roleNames)) {
    return { ok: true };
  }
  if (!can(permissions, MODULE_SLUGS.communications, "create")) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}
