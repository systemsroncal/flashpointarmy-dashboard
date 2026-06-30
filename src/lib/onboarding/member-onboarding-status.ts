import {
  loadCoachMeetingForUser,
  loadFirstMissionForUser,
  loadTrainingLessonCounts,
  loadTrainingStepStatus,
} from "@/lib/onboarding/onboarding-records";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrainingStepStatus = "pending" | "in_progress" | "completed";
export type CoachMeetingStepStatus = "locked" | "pending" | "in_progress" | "completed";
export type FirstMissionStepStatus = "locked" | "pending" | "in_progress" | "completed";

export type MissionRankAudience = "local_leader" | "member";

export type MemberOnboardingSnapshot = {
  training: TrainingStepStatus;
  coachMeeting: CoachMeetingStepStatus;
  firstMission: FirstMissionStepStatus;
  rankLabel: string;
  rankAudience: MissionRankAudience;
  trainingCompletedLessons: number;
  trainingTotalLessons: number;
};

/** Members and local leaders see the onboarding panel on National overview. */
export function isMemberOnboardingAudience(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "member" || n === "local_leader");
}

export function resolveCoachMeetingStepStatus(
  training: TrainingStepStatus,
  rowStatus: CoachMeetingStepStatus | null,
  hasPersistedRow: boolean
): CoachMeetingStepStatus {
  if (training !== "completed") return "locked";
  if (!hasPersistedRow) return "pending";
  if (rowStatus === "locked") return "pending";
  return rowStatus ?? "pending";
}

export function resolveFirstMissionStepStatus(
  coachMeeting: CoachMeetingStepStatus,
  rowStatus: FirstMissionStepStatus | null,
  hasPersistedRow: boolean
): FirstMissionStepStatus {
  if (coachMeeting !== "completed") return "locked";
  if (!hasPersistedRow) return "pending";
  if (rowStatus === "locked") return "pending";
  return rowStatus ?? "pending";
}

export async function loadMemberOnboardingSnapshot(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<MemberOnboardingSnapshot> {
  const [training, coachMeetingRow, firstMissionRow, lessonCounts] = await Promise.all([
    loadTrainingStepStatus(supabase, userId),
    loadCoachMeetingForUser(supabase, userId),
    loadFirstMissionForUser(supabase, userId),
    loadTrainingLessonCounts(supabase, userId),
  ]);

  const hasCoachRow = coachMeetingRow.updated_at !== new Date(0).toISOString();
  const coachMeeting = resolveCoachMeetingStepStatus(
    training,
    coachMeetingRow.status,
    hasCoachRow
  );

  const hasFirstMissionRow = firstMissionRow.updated_at !== new Date(0).toISOString();
  const firstMission = resolveFirstMissionStepStatus(
    coachMeeting,
    firstMissionRow.status,
    hasFirstMissionRow
  );

  return {
    training,
    coachMeeting,
    firstMission,
    rankLabel: "Recruit",
    rankAudience: roleNames.includes("local_leader") ? "local_leader" : "member",
    trainingCompletedLessons: lessonCounts.completed,
    trainingTotalLessons: lessonCounts.total,
  };
}

export function formatOnboardingStepLabel(status: string): string {
  switch (status) {
    case "locked":
      return "Locked";
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

/** 0–100 for sidebar journey progress bar. */
export function computeJourneyProgressPercent(snapshot: MemberOnboardingSnapshot): number {
  const stepWeight = 100 / 3;
  let total = 0;

  if (snapshot.training === "completed") {
    total += stepWeight;
  } else if (snapshot.training === "in_progress" && snapshot.trainingTotalLessons > 0) {
    total += stepWeight * (snapshot.trainingCompletedLessons / snapshot.trainingTotalLessons);
  }

  if (snapshot.coachMeeting === "completed") {
    total += stepWeight;
  } else if (snapshot.coachMeeting === "in_progress") {
    total += stepWeight * 0.5;
  }

  if (snapshot.firstMission === "completed") {
    total += stepWeight;
  } else if (snapshot.firstMission === "in_progress") {
    total += stepWeight * 0.5;
  }

  return Math.min(100, Math.round(total));
}
