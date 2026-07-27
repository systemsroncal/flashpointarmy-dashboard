import { chunkIdsForInQuery } from "@/lib/admin/dashboard-user-queries";
import {
  loadCoachMeetingsMap,
  loadTrainingStepStatusesForUsers,
} from "@/lib/onboarding/onboarding-records";
import {
  journeyProgressSortDbColumn,
  sortJourneyProgressRows,
  type JourneyProgressSortKey,
} from "@/lib/onboarding/journey-progress-table-sort";
import type { SupabaseClient } from "@supabase/supabase-js";

export type JourneyProgressRow = {
  user_id: string;
  name: string;
  email: string;
  role_label: string;
  chapter_name: string | null;
  chapter_state: string | null;
  course_completed: boolean;
  briefing_completed: boolean;
  missions_started: boolean;
};

export type JourneyProgressStats = {
  total: number;
  courseCompleted: number;
  briefingCompleted: number;
  missionsStarted: number;
  allThree: number;
  noneStarted: number;
};

export type JourneyProgressFilter =
  | "all"
  | "course"
  | "briefing"
  | "missions"
  | "all_three"
  | "none";

export type JourneyProgressListQuery = {
  page: number;
  perPage: number;
  q: string;
  filter: JourneyProgressFilter;
  sort: JourneyProgressSortKey;
  ascending: boolean;
  autocomplete?: boolean;
};

type DashboardUserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  primary_chapter_id: string | null;
  created_at: string;
};

type BaseJourneyRow = Omit<
  JourneyProgressRow,
  "course_completed" | "briefing_completed" | "missions_started"
>;

const USER_PAGE_SIZE = 1000;

export function journeyProgressScore(row: JourneyProgressRow): number {
  return (
    (row.course_completed ? 1 : 0) +
    (row.briefing_completed ? 1 : 0) +
    (row.missions_started ? 1 : 0)
  );
}

export function compareJourneyProgressRows(a: JourneyProgressRow, b: JourneyProgressRow): number {
  const scoreDiff = journeyProgressScore(b) - journeyProgressScore(a);
  if (scoreDiff !== 0) return scoreDiff;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

export function filterJourneyProgressRows(
  rows: JourneyProgressRow[],
  filter: JourneyProgressFilter
): JourneyProgressRow[] {
  switch (filter) {
    case "course":
      return rows.filter((r) => r.course_completed);
    case "briefing":
      return rows.filter((r) => r.briefing_completed);
    case "missions":
      return rows.filter((r) => r.missions_started);
    case "all_three":
      return rows.filter((r) => r.course_completed && r.briefing_completed && r.missions_started);
    case "none":
      return rows.filter((r) => !r.course_completed && !r.briefing_completed && !r.missions_started);
    default:
      return rows;
  }
}

function roleLabel(roles: Set<string>): string {
  if (roles.has("super_admin")) return "Super admin";
  if (roles.has("admin")) return "Admin";
  if (roles.has("sub_admin")) return "Sub admin";
  if (roles.has("local_leader")) return "Local leader";
  if (roles.has("member")) return "Member";
  return "—";
}

function displayName(u: DashboardUserRow): string {
  return (
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    u.display_name?.trim() ||
    u.email.split("@")[0] ||
    "—"
  );
}

/** Load all dashboard users (PostgREST caps at 1000 rows per request). */
async function fetchAllDashboardUsers(admin: SupabaseClient): Promise<DashboardUserRow[]> {
  const rows: DashboardUserRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await admin
      .from("dashboard_users")
      .select("id, first_name, last_name, display_name, email, primary_chapter_id, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + USER_PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const batch = (data ?? []) as DashboardUserRow[];
    rows.push(...batch);
    if (batch.length < USER_PAGE_SIZE) break;
    offset += USER_PAGE_SIZE;
  }

  return rows;
}

async function loadRoleMap(admin: SupabaseClient, ids: string[]): Promise<Map<string, Set<string>>> {
  const roleByUser = new Map<string, Set<string>>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data: ur } = await admin.from("user_roles").select("user_id, roles ( name )").in("user_id", chunk);
    for (const row of ur ?? []) {
      const uid = row.user_id as string;
      const name = (row.roles as { name?: string } | null)?.name;
      if (!name) continue;
      if (!roleByUser.has(uid)) roleByUser.set(uid, new Set());
      roleByUser.get(uid)!.add(name);
    }
  }
  return roleByUser;
}

async function loadChapterMap(
  admin: SupabaseClient,
  chapterIds: string[]
): Promise<Map<string, { name: string; state: string | null }>> {
  const chapterById = new Map<string, { name: string; state: string | null }>();
  for (let i = 0; i < chapterIds.length; i += 200) {
    const chunk = chapterIds.slice(i, i + 200);
    const { data: chapters } = await admin.from("chapters").select("id, name, state").in("id", chunk);
    for (const c of chapters ?? []) {
      chapterById.set(c.id as string, {
        name: (c.name as string) ?? "—",
        state: (c.state as string | null) ?? null,
      });
    }
  }
  return chapterById;
}

async function loadMissionsStartedSet(admin: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (const part of chunkIdsForInQuery(ids, 200)) {
    const { data } = await admin
      .from("member_journey_milestones")
      .select("user_id, missions_started_notified_at")
      .in("user_id", part);
    for (const row of data ?? []) {
      if (row.missions_started_notified_at) {
        out.add(row.user_id as string);
      }
    }
  }
  return out;
}

async function loadJourneyProgressBaseIndex(admin: SupabaseClient): Promise<BaseJourneyRow[]> {
  const users = await fetchAllDashboardUsers(admin);
  const ids = users.map((u) => u.id);
  const chapterIds = [
    ...new Set(users.map((u) => u.primary_chapter_id).filter((id): id is string => Boolean(id))),
  ];

  const [roleByUser, chapterById] = await Promise.all([
    loadRoleMap(admin, ids),
    loadChapterMap(admin, chapterIds),
  ]);

  return users.map((u) => {
    const roles = roleByUser.get(u.id) ?? new Set();
    const chId = u.primary_chapter_id;
    const ch = chId ? chapterById.get(chId) : null;
    return {
      user_id: u.id,
      name: displayName(u),
      email: u.email ?? "",
      role_label: roleLabel(roles),
      chapter_name: ch?.name ?? null,
      chapter_state: ch?.state ?? null,
    };
  });
}

function applyTextSearch(base: BaseJourneyRow[], q: string): BaseJourneyRow[] {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return base;
  return base.filter((row) =>
    [row.name, row.email, row.role_label, row.chapter_name ?? "", row.chapter_state ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
}

async function enrichJourneyRows(
  admin: SupabaseClient,
  baseRows: BaseJourneyRow[]
): Promise<JourneyProgressRow[]> {
  if (!baseRows.length) return [];
  const ids = baseRows.map((r) => r.user_id);
  const [trainingMap, coachMap, missionsStarted] = await Promise.all([
    loadTrainingStepStatusesForUsers(admin, ids),
    loadCoachMeetingsMap(admin, ids),
    loadMissionsStartedSet(admin, ids),
  ]);

  return baseRows.map((row) => ({
    ...row,
    course_completed: trainingMap.get(row.user_id) === "completed",
    briefing_completed: coachMap.get(row.user_id)?.status === "completed",
    missions_started: missionsStarted.has(row.user_id),
  }));
}

function canUseSqlPagination(query: JourneyProgressListQuery): boolean {
  return (
    query.filter === "all" &&
    !query.autocomplete &&
    (query.sort === "name" || query.sort === "email")
  );
}

async function queryJourneyProgressSqlPaginated(
  admin: SupabaseClient,
  query: JourneyProgressListQuery
): Promise<{ rows: JourneyProgressRow[]; total: number; page: number; perPage: number }> {
  const page = Math.max(0, query.page);
  const perPage = Math.min(200, Math.max(1, query.perPage));
  const q = query.q.trim();

  let dbQuery = admin
    .from("dashboard_users")
    .select(
      "id, first_name, last_name, display_name, email, primary_chapter_id, created_at",
      { count: "exact" }
    )
    .order(journeyProgressSortDbColumn(query.sort), { ascending: query.ascending })
    .order("id", { ascending: true });

  if (q.length >= 2) {
    dbQuery = dbQuery.or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`
    );
  }

  const from = page * perPage;
  const to = from + perPage - 1;
  const { data, count, error } = await dbQuery.range(from, to);
  if (error) throw new Error(error.message);

  const users = (data ?? []) as DashboardUserRow[];
  const ids = users.map((u) => u.id);
  const chapterIds = [
    ...new Set(users.map((u) => u.primary_chapter_id).filter((id): id is string => Boolean(id))),
  ];
  const [roleByUser, chapterById] = await Promise.all([
    loadRoleMap(admin, ids),
    loadChapterMap(admin, chapterIds),
  ]);

  const baseRows: BaseJourneyRow[] = users.map((u) => {
    const roles = roleByUser.get(u.id) ?? new Set();
    const chId = u.primary_chapter_id;
    const ch = chId ? chapterById.get(chId) : null;
    return {
      user_id: u.id,
      name: displayName(u),
      email: u.email ?? "",
      role_label: roleLabel(roles),
      chapter_name: ch?.name ?? null,
      chapter_state: ch?.state ?? null,
    };
  });

  const rows = await enrichJourneyRows(admin, baseRows);
  return { rows, total: count ?? 0, page, perPage };
}

async function journeyProgressAutocomplete(
  admin: SupabaseClient,
  q: string
): Promise<Array<{ id: string; label: string }>> {
  if (q.length < 2) return [];
  const { data, error } = await admin
    .from("dashboard_users")
    .select("id, email, first_name, last_name, display_name")
    .or(
      `email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,display_name.ilike.%${q}%`
    )
    .order("email")
    .limit(20);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const first = (row.first_name as string | null) ?? "";
    const last = (row.last_name as string | null) ?? "";
    const display = (row.display_name as string | null) ?? "";
    const full = `${first} ${last}`.trim() || display || (row.email as string);
    return {
      id: row.id as string,
      label: `${full} — ${row.email as string}`,
    };
  });
}

export async function queryJourneyProgressPaginated(
  admin: SupabaseClient,
  query: JourneyProgressListQuery
): Promise<{
  rows: JourneyProgressRow[];
  total: number;
  page: number;
  perPage: number;
  options?: Array<{ id: string; label: string }>;
}> {
  if (query.autocomplete) {
    const options = await journeyProgressAutocomplete(admin, query.q.trim());
    return { rows: [], total: 0, page: 0, perPage: 0, options };
  }

  const page = Math.max(0, query.page);
  const perPage = Math.min(200, Math.max(1, query.perPage));

  if (canUseSqlPagination(query)) {
    return queryJourneyProgressSqlPaginated(admin, { ...query, page, perPage });
  }

  const baseIndex = await loadJourneyProgressBaseIndex(admin);
  let searched = applyTextSearch(baseIndex, query.q);
  let enriched = await enrichJourneyRows(admin, searched);
  enriched = filterJourneyProgressRows(enriched, query.filter);
  enriched = sortJourneyProgressRows(enriched, query.sort, query.ascending);

  const total = enriched.length;
  const pageRows = enriched.slice(page * perPage, page * perPage + perPage);

  return { rows: pageRows, total, page, perPage };
}

export async function loadJourneyProgressStats(admin: SupabaseClient): Promise<JourneyProgressStats> {
  const baseIndex = await loadJourneyProgressBaseIndex(admin);
  const enriched = await enrichJourneyRows(admin, baseIndex);

  return {
    total: enriched.length,
    courseCompleted: enriched.filter((r) => r.course_completed).length,
    briefingCompleted: enriched.filter((r) => r.briefing_completed).length,
    missionsStarted: enriched.filter((r) => r.missions_started).length,
    allThree: enriched.filter(
      (r) => r.course_completed && r.briefing_completed && r.missions_started
    ).length,
    noneStarted: enriched.filter(
      (r) => !r.course_completed && !r.briefing_completed && !r.missions_started
    ).length,
  };
}

/** @deprecated Use queryJourneyProgressPaginated + loadJourneyProgressStats */
export async function loadJourneyProgressBundle(admin: SupabaseClient): Promise<{
  rows: JourneyProgressRow[];
  stats: JourneyProgressStats;
}> {
  const [rowsResult, stats] = await Promise.all([
    queryJourneyProgressPaginated(admin, {
      page: 0,
      perPage: 200,
      q: "",
      filter: "all",
      sort: "progress",
      ascending: false,
    }),
    loadJourneyProgressStats(admin),
  ]);
  return { rows: rowsResult.rows, stats };
}
