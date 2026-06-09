import {
  chunkIdsForInQuery,
  listProfilesByIds,
  listRoleNamesByUserIds,
  preferNonEmptyAddr,
} from "@/lib/admin/dashboard-user-queries";
import { listChapterIdsForState } from "@/lib/community/community-members-data";
import type { SupabaseClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;
const ID_CHUNK = 200;

export type UserDirectoryExportKind = "members" | "leaders";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function collectUserIdsForRole(admin: SupabaseClient, roleName: string): Promise<string[]> {
  const { data: role, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .maybeSingle();
  if (roleErr) throw new Error(roleErr.message);
  if (!role?.id) return [];

  const ids = new Set<string>();
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role_id", role.id)
      .order("user_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    for (const row of batch) ids.add(row.user_id as string);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return [...ids];
}

async function fetchUsersByIds(admin: SupabaseClient, ids: string[]) {
  if (ids.length === 0) return [];
  const rows: Array<{
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    phone: string | null;
    primary_chapter_id: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    created_at: string;
  }> = [];
  for (const part of chunkArray(ids, ID_CHUNK)) {
    const { data, error } = await admin
      .from("dashboard_users")
      .select(
        "id, email, first_name, last_name, display_name, phone, primary_chapter_id, address_line, city, state, zip_code, created_at"
      )
      .in("id", part);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
  }
  return rows;
}

async function fetchChapterMap(admin: SupabaseClient) {
  const { data, error } = await admin.from("chapters").select("id, name, city, state, zip_code");
  if (error) throw new Error(error.message);
  const map = new Map<string, { name: string; city: string | null; state: string }>();
  for (const ch of data ?? []) map.set(ch.id as string, ch as { name: string; city: string | null; state: string });
  return map;
}

async function filterUserIdsByChapterScope(
  admin: SupabaseClient,
  userIds: string[],
  opts: { chapterId?: string; stateFilter?: string }
): Promise<string[]> {
  const chapterId = opts.chapterId?.trim();
  const stateFilter = opts.stateFilter?.trim().toUpperCase();
  if ((!chapterId || chapterId === "all") && (!stateFilter || stateFilter === "ALL")) {
    return userIds;
  }

  let chapterIds: string[] | null = null;
  if (chapterId && chapterId !== "all") {
    chapterIds = [chapterId];
  } else if (stateFilter && stateFilter !== "ALL") {
    chapterIds = await listChapterIdsForState(admin, stateFilter);
  }
  if (!chapterIds?.length) return [];

  const allowed = new Set<string>();
  for (const part of chunkIdsForInQuery(userIds, ID_CHUNK)) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .in("primary_chapter_id", chapterIds)
      .in("id", part);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) allowed.add(row.id as string);
  }
  return userIds.filter((id) => allowed.has(id));
}

export async function buildUserDirectoryExportRows(
  admin: SupabaseClient,
  kind: UserDirectoryExportKind,
  opts?: { chapterId?: string; stateFilter?: string }
): Promise<Record<string, string>[]> {
  const roleName = kind === "members" ? "member" : "local_leader";
  let userIds = await collectUserIdsForRole(admin, roleName);
  userIds = await filterUserIdsByChapterScope(admin, userIds, opts ?? {});

  const users = await fetchUsersByIds(admin, userIds);
  users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? "", undefined, { sensitivity: "base" }));

  const profiles = await listProfilesByIds(admin, userIds);
  const profileById = new Map(profiles.map((p) => [p.id as string, p]));
  const roleByUser = await listRoleNamesByUserIds(admin, userIds);
  const chapterMap = await fetchChapterMap(admin);

  return users.map((user) => {
    const p = profileById.get(user.id);
    const chapterId = p?.primary_chapter_id ?? user.primary_chapter_id ?? null;
    const chapter = chapterId ? chapterMap.get(chapterId) : null;
    return {
      Email: user.email ?? "",
      "First name": user.first_name ?? "",
      "Last name": user.last_name ?? "",
      "Display name": user.display_name ?? "",
      Phone: preferNonEmptyAddr(p?.phone, user.phone) ?? "",
      "Address line": preferNonEmptyAddr(p?.address_line, user.address_line) ?? "",
      City: preferNonEmptyAddr(p?.city, user.city) ?? "",
      State: preferNonEmptyAddr(p?.state, user.state) ?? "",
      ZIP: preferNonEmptyAddr(p?.zip_code, user.zip_code) ?? "",
      "Chapter name": chapter?.name ?? "",
      "Chapter city": chapter?.city ?? "",
      "Chapter state": chapter?.state ?? "",
      Roles: (roleByUser.get(user.id) ?? []).join(", "),
      "Registered at": user.created_at ?? "",
      "User ID": user.id ?? "",
    };
  });
}
