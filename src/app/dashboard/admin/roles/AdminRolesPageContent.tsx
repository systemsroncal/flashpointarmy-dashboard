import { RolesAdmin } from "@/components/dashboard/RolesAdmin";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminRolesPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.adminRoles, "read")) {
    return (
      <RolesAdmin allowed={false} canEdit={false} roles={[]} modules={[]} matrix={[]} />
    );
  }

  const [{ data: roles }, { data: modules }, { data: rolePerms }] = await Promise.all([
    supabase.from("roles").select("id, name, description").order("name"),
    supabase.from("modules").select("id, slug, name").order("sort_order"),
    supabase
      .from("role_permissions")
      .select("role_id, module_id, can_create, can_read, can_update, can_delete"),
  ]);

  const canEdit = can(permissions, MODULE_SLUGS.adminRoles, "update");

  return (
    <RolesAdmin
      allowed
      canEdit={canEdit}
      roles={roles ?? []}
      modules={modules ?? []}
      matrix={rolePerms ?? []}
    />
  );
}
