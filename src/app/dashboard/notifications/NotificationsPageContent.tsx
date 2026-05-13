import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { NotificationsAppClient } from "@/components/dashboard/notifications/NotificationsAppClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { can } from "@/types/permissions";
import { redirect } from "next/navigation";

export default async function NotificationsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.communications, "read")) {
    return <AccessDenied message="You do not have access to notifications." />;
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canManage = roleNames.includes("admin") || roleNames.includes("super_admin");

  return <NotificationsAppClient canManage={canManage} />;
}
