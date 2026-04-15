import { ChapertsPanel } from "@/components/dashboard/ChapertsPanel";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ChapertsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  const allowed = can(permissions, MODULE_SLUGS.chaperts, "read");

  return <ChapertsPanel allowed={allowed} />;
}
