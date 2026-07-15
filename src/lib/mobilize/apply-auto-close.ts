import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks inactive open subgroups as auto_closed when past the policy window.
 * Safe to call on read paths; no-op if settings/columns missing.
 */
export async function applyMobilizeAutoCloseInactive(
  admin: SupabaseClient,
  groupIds?: string[]
): Promise<void> {
  try {
    const { data: policy } = await admin
      .from("mobilize_policy_settings")
      .select("auto_close_inactive_days")
      .eq("id", 1)
      .maybeSingle();

    const days = Math.max(
      1,
      Number((policy as { auto_close_inactive_days?: number } | null)?.auto_close_inactive_days ?? 60)
    );
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let q = admin
      .from("mobilize_groups")
      .update({ enrollment_mode: "auto_closed" })
      .not("parent_group_id", "is", null)
      .in("enrollment_mode", ["request_to_join", "open_signup"])
      .lt("last_activity_at", cutoff);

    if (groupIds?.length) {
      q = q.in("id", groupIds);
    }

    await q;
  } catch {
    /* migration may not be applied yet */
  }
}
