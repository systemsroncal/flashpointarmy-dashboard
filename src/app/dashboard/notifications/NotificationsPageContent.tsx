import { NotificationsAppClient } from "@/components/dashboard/notifications/NotificationsAppClient";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function NotificationsPageContent() {
  const { supabase, user } = await requireServerUser();

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canManage = roleNames.includes("admin") || roleNames.includes("super_admin");

  return <NotificationsAppClient canManage={canManage} />;
}
