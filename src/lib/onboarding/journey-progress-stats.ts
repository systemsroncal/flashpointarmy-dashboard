import type { SupabaseClient } from "@supabase/supabase-js";
import {
  loadCoachMeetingsMap,
  loadTrainingStepStatusesForUsers,
} from "@/lib/onboarding/onboarding-records";

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

function roleLabel(roles: Set<string>): string {
  if (roles.has("super_admin")) return "Super admin";
  if (roles.has("admin")) return "Admin";
  if (roles.has("sub_admin")) return "Sub admin";
  if (roles.has("local_leader")) return "Local leader";
  if (roles.has("member")) return "Member";
  return "—";
}

export async function loadJourneyProgressBundle(admin: SupabaseClient): Promise<{
  rows: JourneyProgressRow[];
  stats: JourneyProgressStats;
}> {
  const { data: users } = await admin
    .from("dashboard_users")
    .select("id, first_name, last_name, display_name, email, primary_chapter_id")
    .order("created_at", { ascending: false })
    .limit(3000);

  const list = users ?? [];
  const ids = list.map((u) => u.id as string);

  const roleByUser = new Map<string, Set<string>>();
  const chapterById = new Map<string, { name: string; state: string | null }>();
  const milestonesByUser = new Map<string, { missions_started_notified_at: string | null }>();

  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const [{ data: ur }, { data: milestones }] = await Promise.all([
      admin.from("user_roles").select("user_id, roles ( name )").in("user_id", chunk),
      admin
        .from("member_journey_milestones")
        .select("user_id, missions_started_notified_at")
        .in("user_id", chunk),
    ]);
    for (const row of ur ?? []) {
      const uid = row.user_id as string;
      const name = (row.roles as { name?: string } | null)?.name;
      if (!name) continue;
      if (!roleByUser.has(uid)) roleByUser.set(uid, new Set());
      roleByUser.get(uid)!.add(name);
    }
    for (const m of milestones ?? []) {
      milestonesByUser.set(m.user_id as string, {
        missions_started_notified_at: (m.missions_started_notified_at as string | null) ?? null,
      });
    }
  }

  const chapterIds = [
    ...new Set(
      list
        .map((u) => u.primary_chapter_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];
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

  const [trainingMap, coachMap] = await Promise.all([
    loadTrainingStepStatusesForUsers(admin, ids),
    loadCoachMeetingsMap(admin, ids),
  ]);

  const rows: JourneyProgressRow[] = list.map((u) => {
    const uid = u.id as string;
    const roles = roleByUser.get(uid) ?? new Set();
    const chId = u.primary_chapter_id as string | null;
    const ch = chId ? chapterById.get(chId) : null;
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      (u.display_name as string | null)?.trim() ||
      (u.email as string)?.split("@")[0] ||
      "—";
    const course_completed = trainingMap.get(uid) === "completed";
    const briefing_completed = coachMap.get(uid)?.status === "completed";
    const missions_started = Boolean(milestonesByUser.get(uid)?.missions_started_notified_at);

    return {
      user_id: uid,
      name,
      email: (u.email as string) ?? "",
      role_label: roleLabel(roles),
      chapter_name: ch?.name ?? null,
      chapter_state: ch?.state ?? null,
      course_completed,
      briefing_completed,
      missions_started,
    };
  });

  const stats: JourneyProgressStats = {
    total: rows.length,
    courseCompleted: rows.filter((r) => r.course_completed).length,
    briefingCompleted: rows.filter((r) => r.briefing_completed).length,
    missionsStarted: rows.filter((r) => r.missions_started).length,
    allThree: rows.filter((r) => r.course_completed && r.briefing_completed && r.missions_started)
      .length,
    noneStarted: rows.filter(
      (r) => !r.course_completed && !r.briefing_completed && !r.missions_started
    ).length,
  };

  return { rows, stats };
}
