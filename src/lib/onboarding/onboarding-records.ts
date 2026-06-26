import {
  listDashboardUsersByIdsWithAuthFallback,
  listRoleNamesByUserIds,
  listUserIdsByRoleNames,
} from "@/lib/admin/dashboard-user-queries";
import {
  BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  isUserCourseComplete,
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

const ADMIN_ROLE_NAMES = ["admin", "super_admin", "sub_admin"] as const;
const MEMBER_ROLE_NAMES = ["member", "local_leader"] as const;

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

async function countCompletedSessionsForUser(
  supabase: SupabaseClient,
  userId: string,
  sessionIds: string[]
): Promise<number> {
  if (!sessionIds.length) return 0;
  const { count } = await supabase
    .from("course_session_progress")
    .select("session_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("session_id", sessionIds)
    .not("completed_at", "is", null);
  return count ?? 0;
}

let cachedSessionIds: string[] | null = null;

async function loadBiblicalCitizenshipSessionIds(supabase: SupabaseClient): Promise<string[]> {
  if (cachedSessionIds) return cachedSessionIds;
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", BIBLICAL_CITIZENSHIP_COURSE_SLUG)
    .maybeSingle();
  if (!course?.id) {
    cachedSessionIds = [];
    return cachedSessionIds;
  }
  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("id")
    .eq("course_id", course.id);
  cachedSessionIds = (sessions ?? []).map((s) => s.id as string);
  return cachedSessionIds;
}

export async function loadTrainingStepStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<TrainingStepStatus> {
  const complete = await isUserCourseComplete(supabase, userId, BIBLICAL_CITIZENSHIP_COURSE_SLUG);
  if (complete) return "completed";
  const sessionIds = await loadBiblicalCitizenshipSessionIds(supabase);
  const completedCount = await countCompletedSessionsForUser(supabase, userId, sessionIds);
  return completedCount > 0 ? "in_progress" : "pending";
}

export async function loadTrainingStepStatusesForUsers(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, TrainingStepStatus>> {
  const out = new Map<string, TrainingStepStatus>();
  if (!userIds.length) return out;

  const sessionIds = await loadBiblicalCitizenshipSessionIds(admin);
  if (!sessionIds.length) {
    for (const id of userIds) out.set(id, "pending");
    return out;
  }

  const { data: prog } = await admin
    .from("course_session_progress")
    .select("user_id, session_id, completed_at")
    .in("user_id", userIds)
    .in("session_id", sessionIds);

  const completedByUser = new Map<string, Set<string>>();
  for (const row of prog ?? []) {
    if (!row.completed_at) continue;
    const uid = row.user_id as string;
    const set = completedByUser.get(uid) ?? new Set<string>();
    set.add(row.session_id as string);
    completedByUser.set(uid, set);
  }

  for (const uid of userIds) {
    const set = completedByUser.get(uid);
    if (set && sessionIds.every((id) => set.has(id))) {
      out.set(uid, "completed");
    } else if (set && set.size > 0) {
      out.set(uid, "in_progress");
    } else {
      out.set(uid, "pending");
    }
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

export async function loadOnboardingMemberRows(admin: SupabaseClient): Promise<OnboardingMemberRow[]> {
  const userIds = await listOnboardingMemberUserIds(admin);
  if (!userIds.length) return [];

  const [users, roleMap, trainingMap, { data: chapters }] = await Promise.all([
    listDashboardUsersByIdsWithAuthFallback(admin, userIds),
    listRoleNamesByUserIds(admin, userIds),
    loadTrainingStepStatusesForUsers(admin, userIds),
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
      const name =
        [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
        u.display_name?.trim() ||
        u.email.split("@")[0] ||
        "—";
      return {
        user_id: u.id,
        name,
        email: u.email,
        role_label: roleLabelFromSlugs(slugs),
        chapter_id: chapterId,
        chapter_name: chapter?.name ?? null,
        chapter_state: chapter?.state ?? null,
        training_status: trainingMap.get(u.id) ?? "pending",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function loadCoachMeetingsMap(
  admin: SupabaseClient,
  userIds: string[]
): Promise<Map<string, CoachMeetingRecord>> {
  const out = new Map<string, CoachMeetingRecord>();
  if (!userIds.length) return out;
  const { data } = await admin
    .from("member_coach_meetings")
    .select("user_id, status, coach_id, coaching_at, description, observations, updated_at")
    .in("user_id", userIds);
  for (const row of (data ?? []) as CoachMeetingRecord[]) {
    out.set(row.user_id, row);
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
  const { data } = await admin
    .from("member_first_missions")
    .select("user_id, status, tutor_id, description, observations, updated_at")
    .in("user_id", userIds);
  for (const row of (data ?? []) as FirstMissionRecord[]) {
    out.set(row.user_id, row);
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
