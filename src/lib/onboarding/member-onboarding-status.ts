import {
  loadCoachMeetingForUser,
  loadFirstMissionForUser,
  loadTrainingStepStatus,
} from "@/lib/onboarding/onboarding-records";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrainingStepStatus = "pending" | "in_progress" | "completed";
export type CoachMeetingStepStatus = "pending" | "in_progress" | "completed";
export type FirstMissionStepStatus = "locked" | "in_progress" | "completed";

export type MissionRankAudience = "local_leader" | "member";

export type MemberOnboardingSnapshot = {
  training: TrainingStepStatus;
  coachMeeting: CoachMeetingStepStatus;
  firstMission: FirstMissionStepStatus;
  rankLabel: string;
  rankAudience: MissionRankAudience;
};

/** Members and local leaders see the onboarding panel on National overview. */
export function isMemberOnboardingAudience(roleNames: string[]): boolean {
  return roleNames.some((n) => n === "member" || n === "local_leader");
}

export async function loadMemberOnboardingSnapshot(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<MemberOnboardingSnapshot> {
  const [training, coachMeetingRow, firstMissionRow] = await Promise.all([
    loadTrainingStepStatus(supabase, userId),
    loadCoachMeetingForUser(supabase, userId),
    loadFirstMissionForUser(supabase, userId),
  ]);

  return {
    training,
    coachMeeting: coachMeetingRow.status,
    firstMission: firstMissionRow.status,
    rankLabel: "Recruit",
    rankAudience: roleNames.includes("local_leader") ? "local_leader" : "member",
  };
}

export function formatOnboardingStepLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "locked":
      return "Locked";
    default:
      return status;
  }
}
