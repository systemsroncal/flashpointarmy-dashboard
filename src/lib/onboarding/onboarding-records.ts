import {
  chunkIdsForInQuery,
  listDashboardUsersByIdsWithAuthFallback,
  listRoleNamesByUserIds,
  listUserIdsByRoleNames,
} from "@/lib/admin/dashboard-user-queries";
import { matchesStateChapterFilter } from "@/lib/chapters/chapter-search";
import {
  BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  loadCountableCourseSessionIds,
} from "@/lib/courses/course-completion";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CoachMeetingStepStatus,
  FirstMissionStepStatus,
  TrainingStepStatus,
} from "@/lib/onboarding/member-onboarding-status";

export type CoachMeetingRecord = {
  user_id: string;
  status: CoachMeetingStepStatus;
  coach_id: string | null;
  coaching_at: string | null;
  description: string | null;
  observations: string | null;
  updated_at: string;
};

export type FirstMissionRecord = {
  user_id: string;
  status: FirstMissionStepStatus;
  tutor_id: string | null;
  description: string | null;
  observations: string | null;
  updated_at: string;
};

export type AdminStaffOption = {
  id: string;
  label: string;
  email: string;
};

export type OnboardingMemberRow = {
  user_id: string;
  name: string;
  email: string;
  role_label: string;
  chapter_id: string | null;
  chapter_name: string | null;
  chapter_state: string | null;
  training_status: TrainingStepStatus;
};

export type OnboardingListQuery = {
  page: number;
  perPage: number;
  chapterId: string;
  state: string;
  q: string;
  coachMeetingStatus?: CoachMeetingStepStatus | "all";
  firstMissionStatus?: FirstMissionStepStatus | "all";
};

const ADMIN_ROLE_NAMES = ["admin", "super_admin", "sub_admin"] as const;
const MEMBER_ROLE_NAMES = ["member", "local_leader"] as const;

let cachedCountableSessionIds: string[] | null = null;

export function resolveTrainingStepStatus(
  completedCount: number,
  totalSessions: number
): TrainingStepStatus {
  if (totalSessions <= 0) return "pending";
  if (completedCount >= totalSessions) return "completed";
  if (completedCount <= 0) return "pending";
  return "in_progress";
}

async function loadCountableSessionIdsCached(supabase: SupabaseClient): Promise<string[]> {
  if (cachedCountableSessionIds) return cachedCountableSessionIds;
  cachedCountableSessionIds = await loadCountableCourseSessionIds(
    supabase,
    BIBLICAL_CITIZENSHIP_COURSE_SLUG
  );
  return cachedCountableSessionIds;
}

export async function listOnboardingMemberUserIds(admin: SupabaseClient): Promise<string[]> {
  return listUserIdsByRoleNames(admin, [...MEMBER_ROLE_NAMES]);
}

export async function listAdminStaffOptions(admin: SupabaseClient): Promise<AdminStaffOption[]> {
  const ids = await listUserIdsByRoleNames(admin, [...ADMIN_ROLE_NAMES]);
  if (!ids.length) return [];
  const users = await listDashboardUsersByIdsWithAuthFallback(admin, ids, { healMirror: false });
  return users
    .map((u) => {
      const name =
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        u.display_name?.trim() ||
        u.email.split("@")[0] ||
        "Administrator";
      return { id: u.id, label: name, email: u.email };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

function roleLabelFromSlugs(slugs: string[]): string {
  if (slugs.includes("local_leader")) return "Local leader";
  if (slugs.includes("member")) return "Member";
  return slugs.join(", ") || "—";
}

function displayNameFromUser(u: {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
}): string {
  return (
    [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
    u.display_name?.trim() ||
    u.email.split("@")[0] ||
    "—"
  );
}

/** Lightweight directory of members + local leaders (no course progress). */
export async function loadOnboardingMemberBaseIndex(
  admin: SupabaseClient
): Promise<Omit<OnboardingMemberRow, "training_status">[]> {
  const userIds = await listOnboardingMemberUserIds(admin);
  if (!userIds.length) return [];

  const [users, roleMap, { data: chapters }] = await Promise.all([
    listDashboardUsersByIdsWithAuthFallback(admin, userIds, { healMirror: false }),
    listRoleNamesByUserIds(admin, userIds),
    admin.from("chapters").select("id, name, state"),
  ]);

  const chapterById = new Map(
    (chapters ?? []).map((c) => [c.id as string, c as { id: string; name: string; state: string | null }])
  );

  return users
    .map((u) => {
      const slugs = roleMap.get(u.id) ?? [];
      const chapterId = u.primary_chapter_id;
      const chapter = chapterId ? chapterById.get(chapterId) : null;
      return {
        user_id: u.id,
        name: displayNameFromUser(u),
        email: u.email,
        role_label: roleLabelFromSlugs(slugs),
        chapter_id: chapterId,
        chapter_name: chapter?.name ?? null,
        chapter_state: chapter?.state ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

async function loadCoachMeetingStatusIndex(
  admin: SupabaseClient
): Promise<Map<string, CoachMeetingStepStatus>> {
  const out = new Map<string, CoachMeetingStepStatus>();
  const { data } = await admin.from("member_coach_meetings").select("user_id, status");
  for (const row of data ?? []) {
    out.set(row.user_id as string, row.status as CoachMeetingStepStatus);
  }
  return out;
}

async function loadFirstMissionStatusIndex(
  admin: SupabaseClient
): Promise<Map<string, FirstMissionStepStatus>> {
  const out = new Map<string, FirstMissionStepStatus>();
  const { data } = await admin.from("member_first_missions").select("user_id, status");
  for (const row of data ?? []) {
    out.set(row.user_id as string, row.status as FirstMissionStepStatus);
  }
  return out;
}

function filterBaseIndex(
  base: Omit<OnboardingMemberRow, "training_status">[],
  query: OnboardingListQuery,
  chapterOptions: { id: string; name: string; state: string }[]
): Omit<OnboardingMemberRow, "training_status">[] {
  const chapterRows = chapterOptions.map((c) => ({
    id: c.id,
    name: c.name,
    city: null as string | null,
    state: c.state,
  }));

  let list = base.filter((row) =>
    matchesStateChapterFilter(row.chapter_id, chapterRows, query.state, query.chapterId)
  );

  const q = query.q.trim().toLowerCase();
  if (q.length >= 2) {
    list = list.filter((row) => {
      const blob = [row.name, row.email, row.chapter_name ?? "", row.chapter_state ?? ""]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  return list;
}

export async function queryOnboardingMembersPaginated(
  admin: SupabaseClient,
  query: OnboardingListQuery,
  chapterOptions: { id: string; name: string; state: string }[]
): Promise<{ rows: OnboardingMemberRow[]; total: number; page: number; perPage: number }> {
  const page = Math.max(0, query.page);
  const perPage = Math.min(200, Math.max(1, query.perPage));

  const [baseIndex, coachStatusIndex, firstMissionStatusIndex] = await Promise.all([
    loadOnboardingMemberBaseIndex(admin),
    query.coachMeetingStatus && query.coachMeetingStatus !== "all"
      ? loadCoachMeetingStatusIndex(admin)
      : Promise.resolve(null),
    query.firstMissionStatus && query.firstMissionStatus !== "all"
      ? loadFirstMissionStatusIndex(admin)
      : Promise.resolve(null),
  ]);

  let filtered = filterBaseIndex(baseIndex, query, chapterOptions);

  if (query.coachMeetingStatus && query.coachMeetingStatus !== "all" && coachStatusIndex) {
    filtered = filtered.filter(
      (row) => (coachStatusIndex.get(row.user_id) ?? "pending") === query.coachMeetingStatus
    );
  }

  if (query.firstMissionStatus && query.firstMissionStatus !== "all" && firstMissionStatusIndex) {
    filtered = filtered.filter(
      (row) => (firstMissionStatusIndex.get(row.user_id) ?? "locked") === query.firstMissionStatus
    );
  }

  const total = filtered.length;
  const pageSlice = filtered.slice(page * perPage, page * perPage + perPage);
  const pageIds = pageSlice.map((r) => r.user_id);
  const trainingMap = await loadTrainingStepStatusesForUsers(admin, pageIds);

  const rows: OnboardingMemberRow[] = pageSlice.map((row) => ({
    ...row,
    training_status: trainingMap.get(row.user_id) ?? "pending",
  }));

  return { rows, total, page, perPage };
}

export async function loadTrainingLessonCounts(
  supabase: SupabaseClient,
  userId: string
): Promise<{ completed: number; total: number }> {
  const sessionIds = await loadCountableSessionIdsCached(supabase);
  if (!sessionIds.length) return { completed: 0, total: 0 };

  const { count } = await supabase
    .from("course_session_progress")
    .select("session_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .not("completed_at", "is", null);

  return { completed: count ?? 0, total: sessionIds.length };
}

export async function loadTrainingStepStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<TrainingStepStatus> {
  const { completed, total } = await loadTrainingLessonCounts(supabase, userId);
  return resolveTrainingStepStatus(completed, total);
}

export async function loadTrainingStepStatusesForUsers(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, TrainingStepStatus>> {
  const out = new Map<string, TrainingStepStatus>();
  if (!userIds.length) return out;

  const sessionIds = await loadCountableSessionIdsCached(admin);
  if (!sessionIds.length) {
    for (const id of userIds) out.set(id, "pending");
    return out;
  }

  const completedByUser = new Map<string, Set<string>>();
  for (const part of chunkIdsForInQuery(userIds, 80)) {
    const { data: prog } = await admin
      .from("course_session_progress")
      .select("user_id, session_id, completed_at")
      .in("user_id", part)
      .in("session_id", sessionIds);

    for (const row of prog ?? []) {
      if (!row.completed_at) continue;
      const uid = row.user_id as string;
      const set = completedByUser.get(uid) ?? new Set<string>();
      set.add(row.session_id as string);
      completedByUser.set(uid, set);
    }
  }

  for (const uid of userIds) {
    const set = completedByUser.get(uid);
    const completedCount = set?.size ?? 0;
    out.set(uid, resolveTrainingStepStatus(completedCount, sessionIds.length));
  }
  return out;
}

export async function loadCoachMeetingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<CoachMeetingRecord> {
  const { data } = await supabase
    .from("member_coach_meetings")
    .select("user_id, status, coach_id, coaching_at, description, observations, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return data as CoachMeetingRecord;
  }
  return {
    user_id: userId,
    status: "pending",
    coach_id: null,
    coaching_at: null,
    description: null,
    observations: null,
    updated_at: new Date(0).toISOString(),
  };
}

export async function loadFirstMissionForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<FirstMissionRecord> {
  const { data } = await supabase
    .from("member_first_missions")
    .select("user_id, status, tutor_id, description, observations, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return data as FirstMissionRecord;
  }
  return {
    user_id: userId,
    status: "locked",
    tutor_id: null,
    description: null,
    observations: null,
    updated_at: new Date(0).toISOString(),
  };
}

export async function loadCoachMeetingsMap(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, CoachMeetingRecord>> {
  const out = new Map<string, CoachMeetingRecord>();
  if (!userIds.length) return out;

  for (const part of chunkIdsForInQuery(userIds, 100)) {
    const { data } = await admin
      .from("member_coach_meetings")
      .select("user_id, status, coach_id, coaching_at, description, observations, updated_at")
      .in("user_id", part);
    for (const row of (data ?? []) as CoachMeetingRecord[]) {
      out.set(row.user_id, row);
    }
  }

  for (const id of userIds) {
    if (!out.has(id)) {
      out.set(id, {
        user_id: id,
        status: "pending",
        coach_id: null,
        coaching_at: null,
        description: null,
        observations: null,
        updated_at: new Date(0).toISOString(),
      });
    }
  }
  return out;
}

export async function loadFirstMissionsMap(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, FirstMissionRecord>> {
  const out = new Map<string, FirstMissionRecord>();
  if (!userIds.length) return out;

  for (const part of chunkIdsForInQuery(userIds, 100)) {
    const { data } = await admin
      .from("member_first_missions")
      .select("user_id, status, tutor_id, description, observations, updated_at")
      .in("user_id", part);
    for (const row of (data ?? []) as FirstMissionRecord[]) {
      out.set(row.user_id, row);
    }
  }

  for (const id of userIds) {
    if (!out.has(id)) {
      out.set(id, {
        user_id: id,
        status: "locked",
        tutor_id: null,
        description: null,
        observations: null,
        updated_at: new Date(0).toISOString(),
      });
    }
  }
  return out;
}

export function displayNameForStaff(
  staffById: Map<string, AdminStaffOption>,
  staffId: string | null
): string {
  if (!staffId) return "—";
  return staffById.get(staffId)?.label ?? "—";
}

/** @deprecated Use queryOnboardingMembersPaginated */
export async function loadOnboardingMemberRows(admin: SupabaseClient): Promise<OnboardingMemberRow[]> {
  const { rows } = await queryOnboardingMembersPaginated(
    admin,
    { page: 0, perPage: 200, chapterId: "all", state: "all", q: "" },
    []
  );
  return rows;
}
