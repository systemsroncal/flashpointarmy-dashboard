import { LogsTable } from "@/components/dashboard/LogsTable";
import { MODULE_SLUGS } from "@/config/modules";
import { can } from "@/types/permissions";
import { loadModulePermissions } from "@/lib/auth/load-permissions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LogsPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const permissions = await loadModulePermissions(supabase, user.id);
  if (!can(permissions, MODULE_SLUGS.logs, "read")) {
    return <LogsTable rows={[]} forbidden error={null} canCreate={false} />;
  }

  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, payload, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const canCreateLog = can(permissions, MODULE_SLUGS.logs, "create");

  return (
    <LogsTable rows={rows ?? []} forbidden={false} error={error} canCreate={canCreateLog} />
  );
}
