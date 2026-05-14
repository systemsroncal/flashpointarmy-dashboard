import { NotificationsAppClient } from "@/components/dashboard/notifications/NotificationsAppClient";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function NotificationsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canManage = roleNames.includes("admin") || roleNames.includes("super_admin");

  return <NotificationsAppClient canManage={canManage} />;
}
