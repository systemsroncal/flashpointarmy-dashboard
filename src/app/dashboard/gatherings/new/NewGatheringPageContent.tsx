import { GatheringForm } from "@/components/dashboard/gatherings/GatheringForm";
import { MODULE_SLUGS } from "@/config/modules";
import { loadUserRoleNames, isElevatedRole } from "@/lib/auth/user-roles";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function NewGatheringPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "create")) {
    redirect("/dashboard/gatherings");
  }

  const roleNames = await loadUserRoleNames(supabase, user.id);
  const canNotifyAllUsers = isElevatedRole(roleNames);

  const [{ data: chapters }, { data: categories }] = await Promise.all([
    supabase.from("chapters").select("id, name, state, address_line, city, zip_code").order("name"),
    supabase.from("event_categories").select("id, name, slug").order("sort_order"),
  ]);

  return (
    <GatheringForm
      chapters={chapters ?? []}
      categories={categories ?? []}
      userId={user.id}
      canNotifyAllUsers={canNotifyAllUsers}
    />
  );
}
