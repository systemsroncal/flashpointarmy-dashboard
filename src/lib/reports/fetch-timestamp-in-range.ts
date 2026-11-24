import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;

/** Paginated load of a nullable timestamptz column in range (e.g. profiles.verified_at). */
export async function fetchTimestampInRange(
  admin: SupabaseClient,
  table: "profiles",
  column: "verified_at",
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin
      .from(table)
      .select(column)
      .not(column, "is", null)
      .gte(column, fromIso)
      .lte(column, toIso)
      .order(column, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data ?? [];
    for (const row of rows) {
      const ts = (row as Record<string, string>)[column];
      if (ts) out.push(ts);
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return out;
}