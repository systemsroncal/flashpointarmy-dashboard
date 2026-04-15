import { LocationsSection } from "@/components/dashboard/LocationsSection";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LocationsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  const read = can(permissions, MODULE_SLUGS.locations, "read");
  const create = can(permissions, MODULE_SLUGS.locations, "create");
  const update = can(permissions, MODULE_SLUGS.locations, "update");
  const del = can(permissions, MODULE_SLUGS.locations, "delete");

  if (!read) {
    return <LocationsSection rows={[]} canCreate={false} canUpdate={false} canDelete={false} forbidden />;
  }

  const { data: rows } = await supabase
    .from("locations")
    .select("id, name, region, created_at")
    .order("created_at", { ascending: false });

  return (
    <LocationsSection
      rows={rows ?? []}
      canCreate={create}
      canUpdate={update}
      canDelete={del}
      forbidden={false}
    />
  );
}
