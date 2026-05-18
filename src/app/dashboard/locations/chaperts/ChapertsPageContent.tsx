import { ChapertsPanel } from "@/components/dashboard/ChapertsPanel";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { requireServerUser } from "@/lib/auth/server-session";

export default async function ChapertsPageContent() {
  const { supabase, user } = await requireServerUser();

  const permissions = await loadModulePermissions(supabase, user.id);
  const allowed = can(permissions, MODULE_SLUGS.chaperts, "read");

  return <ChapertsPanel allowed={allowed} />;
}
