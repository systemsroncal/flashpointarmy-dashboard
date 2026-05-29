import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseCommunityMemberRemoteSortKey,
  sortCommunityMemberBaseRows,
} from "@/lib/community/community-table-sort";

/** User IDs that have `member` and none of `local_leader` / `admin` / `super_admin` / `sub_admin` (same logic as `dashboard_community_members` view). */
export async function listCommunityMemberUserIds(
  admin: SupabaseClient
): Promise<string[]> {
  const { data: memberRole } = await admin.from("roles").select("id").eq("name", "member").maybeSingle();
  if (!memberRole?.id) return [];

  const { data: badRoles } = await admin
    .from("roles")
    .select("id")
    .in("name", ["local_leader", "admin", "super_admin", "sub_admin"]);
  const badRoleIds = (badRoles ?? []).map((r: { id: string }) => r.id);

  const { data: elevatedUr } =
    badRoleIds.length > 0
      ? await admin.from("user_roles").select("user_id").in("role_id", badRoleIds)
      : { data: [] as { user_id: string }[] };
  const elevated = new Set((elevatedUr ?? []).map((r) => String(r.user_id)));

  const { data: memberUr } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role_id", memberRole.id as string);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of memberUr ?? []) {
    const id = String((r as { user_id: string }).user_id);
    if (elevated.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function isMissingCommunityMembersViewError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const m = (err.message ?? "").toLowerCase();
  if (m.includes("dashboard_community_members") && m.includes("does not exist")) return true;
  if (m.includes("schema cache") && m.includes("dashboard_community_members")) return true;
  return err.code === "42P01";
}

const CHUNK = 150;

export type CommunityMemberBaseRow = {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  primary_chapter_id: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

async function fetchDashboardUsersChunks(
  admin: SupabaseClient,
  ids: string[],
  select: string
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const sl = ids.slice(i, i + CHUNK);
    const { data, error } = await admin.from("dashboard_users").select(select).in("id", sl);
    if (error) throw new Error(error.message);
    const rows = ((data ?? []) as unknown) as Record<string, unknown>[];
    out.push(...rows);
  }
  return out;
}

function chapterScope(opts: {
  chapterId: string;
  state?: string;
  stateChapterIds?: string[] | null;
  elevated: boolean;
  isLocalLeader: boolean;
  localChapterId: string | null;
}): { kind: "all" } | { kind: "single"; id: string } | { kind: "multi"; ids: string[] } {
  if (opts.chapterId !== "all") return { kind: "single", id: opts.chapterId };
  const stateIds = opts.stateChapterIds ?? null;
  const st = (opts.state ?? "all").trim().toUpperCase();
  if (st && st !== "ALL") {
    return { kind: "multi", ids: stateIds ?? [] };
  }
  if (!opts.elevated && opts.isLocalLeader && opts.localChapterId) {
    return { kind: "single", id: opts.localChapterId };
  }
  return { kind: "all" };
}

async function filterUserIdsByChapterScope(
  admin: SupabaseClient,
  ids: string[],
  scope: ReturnType<typeof chapterScope>
): Promise<string[]> {
  if (scope.kind === "all") return ids;
  if (scope.kind === "multi" && scope.ids.length === 0) return [];

  const filtered: string[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const sl = ids.slice(i, i + CHUNK);
    let query = admin.from("dashboard_users").select("id").in("id", sl);
    if (scope.kind === "single") {
      query = query.eq("primary_chapter_id", scope.id);
    } else {
      query = query.in("primary_chapter_id", scope.ids);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    for (const r of data ?? []) filtered.push(String((r as { id: string }).id));
  }
  return filtered;
}

export async function listChapterIdsForState(
  admin: SupabaseClient,
  stateCode: string
): Promise<string[]> {
  const st = stateCode.trim().toUpperCase();
  if (!st || st === "ALL") return [];
  const { data, error } = await admin.from("chapters").select("id").eq("state", st);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => String((r as { id: string }).id));
}

/** When `dashboard_community_members` view is missing (migration 032 not applied). */
export async function listCommunityMembersFallback(
  admin: SupabaseClient,
  opts: {
    page: number;
    perPage: number;
    chapterId: string;
    state?: string;
    stateChapterIds?: string[] | null;
    q: string;
    elevated: boolean;
    isLocalLeader: boolean;
    localChapterId: string | null;
    selectedUserId: string;
    sortKey?: string;
    sortAsc?: boolean;
  }
): Promise<{ rows: CommunityMemberBaseRow[]; count: number }> {
  const { page, perPage, q, selectedUserId } = opts;
  const sortKey = parseCommunityMemberRemoteSortKey(opts.sortKey);
  const sortAsc = opts.sortAsc ?? false;
  const scope = chapterScope(opts);

  let ids = await listCommunityMemberUserIds(admin);
  if (ids.length === 0) return { rows: [], count: 0 };

  if (scope.kind !== "all") {
    ids = await filterUserIdsByChapterScope(admin, ids, scope);
    if (ids.length === 0) return { rows: [], count: 0 };
  }

  if (selectedUserId) {
    ids = ids.filter((id) => id === selectedUserId);
  }

  const selectCols =
    "id, email, phone, display_name, created_at, first_name, last_name, primary_chapter_id, address_line, city, state, zip_code";
  const allRows = (await fetchDashboardUsersChunks(admin, ids, selectCols)) as CommunityMemberBaseRow[];

  let list = allRows;
  if (q.length >= 2) {
    const ql = q.toLowerCase();
    list = list.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(ql) ||
        (u.first_name ?? "").toLowerCase().includes(ql) ||
        (u.last_name ?? "").toLowerCase().includes(ql) ||
        (u.display_name ?? "").toLowerCase().includes(ql) ||
        (u.phone ?? "").toLowerCase().includes(ql) ||
        (u.address_line ?? "").toLowerCase().includes(ql) ||
        (u.city ?? "").toLowerCase().includes(ql) ||
        (u.state ?? "").toLowerCase().includes(ql) ||
        (u.zip_code ?? "").toLowerCase().includes(ql)
    );
  }

  list = sortCommunityMemberBaseRows(list, sortKey, sortAsc);

  const total = list.length;
  const from = page * perPage;
  return { rows: list.slice(from, from + perPage), count: total };
}

export async function communityMembersAutocompleteFallback(
  admin: SupabaseClient,
  opts: {
    q: string;
    chapterId: string;
    state?: string;
    stateChapterIds?: string[] | null;
    elevated: boolean;
    isLocalLeader: boolean;
    localChapterId: string | null;
  }
): Promise<Array<{ id: string; label: string }>> {
  const scope = chapterScope(opts);
  let ids = await listCommunityMemberUserIds(admin);
  if (ids.length === 0) return [];

  if (scope.kind !== "all") {
    ids = await filterUserIdsByChapterScope(admin, ids, scope);
    if (ids.length === 0) return [];
  }

  const ql = opts.q.trim().toLowerCase();
  const options: Array<{ id: string; label: string }> = [];
  for (let i = 0; i < ids.length && options.length < 20; i += CHUNK) {
    const sl = ids.slice(i, i + CHUNK);
    const { data, error } = await admin
      .from("dashboard_users")
      .select("id, email, first_name, last_name, display_name")
      .in("id", sl);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const u = row as {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
      };
      const blob = [u.email, u.first_name, u.last_name, u.display_name].join(" ").toLowerCase();
      if (!blob.includes(ql)) continue;
      const first = u.first_name ?? "";
      const last = u.last_name ?? "";
      const display = u.display_name ?? "";
      const full = `${first} ${last}`.trim() || display || u.email;
      options.push({ id: u.id, label: `${full} — ${u.email}` });
      if (options.length >= 20) break;
    }
  }
  return options;
}
