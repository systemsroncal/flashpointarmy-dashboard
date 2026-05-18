import { getAuthUser } from "@/utils/supabase/get-auth-user";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAuditLog(
  supabase: SupabaseClient,
  action: string,
  entityType?: string,
  entityId?: string,
  payload?: Record<string, unknown>
) {
  const { user } = await getAuthUser(supabase);
  await supabase.from("audit_logs").insert({
    user_id: user?.id ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    payload: payload ?? {},
  });
}
