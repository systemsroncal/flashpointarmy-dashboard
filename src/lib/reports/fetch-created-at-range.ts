import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

/**
 * Load all `created_at` values in a date range. PostgREST caps at 1000 rows per request;
 * without pagination, long ranges (e.g. 30d after a bulk import) drop recent registrations.
 */
export async function fetchCreatedAtInRange(
  admin: SupabaseClient,
  table: "dashboard_users" | "chapters" | "gatherings",
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin
      .from(table)
      .select("created_at")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data ?? [];
    for (const row of rows) {
      const ts = (row as { created_at: string }).created_at;
      if (ts) out.push(ts);
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return out;
}
