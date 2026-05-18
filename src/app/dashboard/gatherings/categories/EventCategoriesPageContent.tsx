import { EventCategoriesClient } from "@/components/dashboard/gatherings/EventCategoriesClient";
import { MODULE_SLUGS } from "@/config/modules";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function EventCategoriesPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.gatherings, "read")) {
    redirect("/dashboard/gatherings");
  }

  const { data: cats } = await supabase
    .from("event_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");

  return (
    <EventCategoriesClient
      initial={cats ?? []}
      canMutate={can(permissions, MODULE_SLUGS.gatherings, "create")}
    />
  );
}
