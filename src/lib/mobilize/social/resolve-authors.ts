import type { SupabaseClient } from "@supabase/supabase-js";

export type MobilizeAuthorSummary = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  /** True when profiles.verified_at is set (super_admin account verification). */
  verified?: boolean;
  /** When the account was verified — shown in the verified badge popover. */
  verified_at?: string | null;
  /** Whether the current viewer follows this author (when viewerId was provided). */
  is_following?: boolean;
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

const ID_CHUNK_SIZE = 250;

/**
 * PostgREST encodes `in.(...)` values into the request URL, so querying a large
 * id list at once blows past URL length limits (414 from Cloudflare) and the
 * whole call fails. Fetch in chunks so big lists (e.g. thousands of followers)
 * still resolve instead of silently returning nothing.
 */
async function fetchByIdsChunked<T>(
  admin: SupabaseClient,
  table: "profiles" | "dashboard_users",
  columns: string,
  ids: string[]
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + ID_CHUNK_SIZE);
    const { data, error } = await admin.from(table).select(columns).in("id", chunk);
    if (error) continue; // best-effort: keep whatever chunks resolved
    rows.push(...((data ?? []) as T[]));
  }
  return rows;
}

async function loadFollowingSet(
  admin: SupabaseClient,
  viewerId: string,
  candidateIds: string[]
): Promise<Set<string>> {
  const following = new Set<string>();
  for (let i = 0; i < candidateIds.length; i += ID_CHUNK_SIZE) {
    const chunk = candidateIds.slice(i, i + ID_CHUNK_SIZE);
    const { data } = await admin
      .from("mobilize_user_follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", chunk);
    for (const row of data ?? []) {
      following.add(row.following_id as string);
    }
  }
  return following;
}

export async function resolveMobilizeAuthors(
  admin: SupabaseClient,
  userIds: string[],
  options?: { viewerId?: string }
): Promise<Map<string, MobilizeAuthorSummary>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, MobilizeAuthorSummary>();
  if (!unique.length) return map;

  const viewerId = options?.viewerId;

  const [profilesWithVerified, users, followingSet] = await Promise.all([
    fetchByIdsChunked<Record<string, unknown>>(
      admin,
      "profiles",
      "id, display_name, first_name, last_name, avatar_url, verified_at",
      unique
    ),
    fetchByIdsChunked<Record<string, unknown>>(
      admin,
      "dashboard_users",
      "id, display_name, first_name, last_name",
      unique
    ),
    viewerId ? loadFollowingSet(admin, viewerId, unique) : Promise.resolve(null),
  ]);

  // If verified_at is not migrated yet, retry without that column so feeds still resolve.
  let profiles = profilesWithVerified;
  if (!profiles.length && unique.length) {
    profiles = await fetchByIdsChunked<Record<string, unknown>>(
      admin,
      "profiles",
      "id, display_name, first_name, last_name, avatar_url",
      unique
    );
  }

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
    const verifiedAt = (row.verified_at as string | null | undefined) ?? null;
    map.set(id, {
      id,
      display_name,
      handle: buildHandle({ ...(row as object), id } as Parameters<typeof buildHandle>[0]),
      avatar_url: (row.avatar_url as string | null | undefined) ?? null,
      verified: Boolean(verifiedAt),
      verified_at: verifiedAt,
      ...(viewerId
        ? { is_following: id === viewerId ? true : Boolean(followingSet?.has(id)) }
        : {}),
    });
  }
  return map;
}
