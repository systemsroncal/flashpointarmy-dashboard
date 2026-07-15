import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeAuthorSummary = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
};

function buildDisplayName(row: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  const dn = row.display_name?.trim();
  if (dn) return dn;
  const parts = [row.first_name?.trim(), row.last_name?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Member";
}

function buildHandle(row: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  id: string;
}): string {
  const base =
    row.display_name?.trim() ||
    [row.first_name?.trim(), row.last_name?.trim()].filter(Boolean).join("") ||
    row.id.slice(0, 8);
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return `@${slug || row.id.slice(0, 8)}`;
}

export async function resolveMobilizeAuthors(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, MobilizeAuthorSummary>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, MobilizeAuthorSummary>();
  if (!unique.length) return map;

  const [{ data: profiles }, { data: users }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, first_name, last_name, avatar_url")
      .in("id", unique),
    admin
      .from("dashboard_users")
      .select("id, display_name, first_name, last_name")
      .in("id", unique),
  ]);

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of users ?? []) {
    byId.set(row.id as string, row as Record<string, unknown>);
  }
  for (const row of profiles ?? []) {
    const id = row.id as string;
    byId.set(id, { ...byId.get(id), ...row });
  }

  for (const id of unique) {
    const row = byId.get(id) ?? { id };
    const display_name = buildDisplayName(row as Parameters<typeof buildDisplayName>[0]);
    map.set(id, {
      id,
      display_name,
      handle: buildHandle({ ...(row as object), id } as Parameters<typeof buildHandle>[0]),
      avatar_url: (row.avatar_url as string | null | undefined) ?? null,
    });
  }
  return map;
}
