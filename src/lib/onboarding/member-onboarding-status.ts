import {
  loadCoachMeetingForUser,
  loadFirstMissionForUser,
  loadTrainingLessonCounts,
  loadTrainingStepStatus,
} from "@/lib/onboarding/onboarding-records";
import { loadJourneyMilestones } from "@/lib/onboarding/journey-milestones";
import { isMissionsStartedForUser } from "@/lib/onboarding/missions-started";
import { resolveCurrentMissionRankLabel, type MissionRankProgress } from "@/lib/onboarding/mission-rank-info";
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

/** Admins and super admins see Your Journey in the sidebar with all steps completed. */
export function isAdminJourneySidebarAudience(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "admin" || n === "super_admin");
}

export function createAdminCompletedJourneySnapshot(): MemberOnboardingSnapshot {
  const rankAudience: MissionRankAudience = "member";
  const partial: MissionRankProgress = {
    training: "completed",
    coachMeeting: "completed",
    firstMission: "completed",
    rankAudience,
  };
  return {
    ...partial,
    rankLabel: resolveCurrentMissionRankLabel(partial),
    trainingCompletedLessons: 0,
    trainingTotalLessons: 0,
  };
}

export function shouldShowSidebarYourJourney(
  roleNames: string[],
  snapshot: MemberOnboardingSnapshot | null | undefined
): boolean {
  if (!snapshot) return false;
  return isMemberOnboardingAudience(roleNames) || isAdminJourneySidebarAudience(roleNames);
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

/**
 * Step 3 status for Your Journey / Training nav.
 * When Journey Progress would show Mission Started = Yes, this step is `completed`
 * (once Mission Briefing is done), so the sidebar matches admin Yes.
 */
export function resolveFirstMissionStepStatus(
  coachMeeting: CoachMeetingStepStatus,
  rowStatus: FirstMissionStepStatus | null,
  hasPersistedRow: boolean,
  missionsStarted = false
): FirstMissionStepStatus {
  if (coachMeeting !== "completed") return "locked";
  if (missionsStarted) return "completed";
  if (!hasPersistedRow) return "pending";
  if (rowStatus === "locked") return "pending";
  return rowStatus ?? "pending";
}

export async function loadMemberOnboardingSnapshot(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<MemberOnboardingSnapshot> {
  const [training, coachMeetingRow, firstMissionRow, lessonCounts, milestones] = await Promise.all([
    loadTrainingStepStatus(supabase, userId),
    loadCoachMeetingForUser(supabase, userId),
    loadFirstMissionForUser(supabase, userId),
    loadTrainingLessonCounts(supabase, userId),
    loadJourneyMilestones(supabase, userId),
  ]);

  const hasCoachRow = coachMeetingRow.updated_at !== new Date(0).toISOString();
  const coachMeeting = resolveCoachMeetingStepStatus(
    training,
    coachMeetingRow.status,
    hasCoachRow
  );

  const hasFirstMissionRow = firstMissionRow.updated_at !== new Date(0).toISOString();
  const missionsStarted = isMissionsStartedForUser({
    missions_started_notified_at: milestones?.missions_started_notified_at,
    missions_welcome_seen_at: milestones?.missions_welcome_seen_at,
    firstMissionStatus: hasFirstMissionRow ? firstMissionRow.status : null,
  });
  const firstMission = resolveFirstMissionStepStatus(
    coachMeeting,
    firstMissionRow.status,
    hasFirstMissionRow,
    missionsStarted
  );

  const rankAudience: MissionRankAudience = roleNames.includes("local_leader")
    ? "local_leader"
    : "member";
  const partial: MissionRankProgress = {
    training,
    coachMeeting,
    firstMission,
    rankAudience,
  };

  return {
    ...partial,
    rankLabel: resolveCurrentMissionRankLabel(partial),
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
