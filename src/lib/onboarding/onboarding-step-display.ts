import type {
  CoachMeetingStepStatus,
  FirstMissionStepStatus,
  MissionRankAudience,
  TrainingStepStatus,
} from "@/lib/onboarding/member-onboarding-status";

export type OnboardingStepKey = "training" | "coachMeeting" | "firstMission";

export type StepDisplay = {
  label: string;
  tooltip: string;
};

const FIRST_MISSION_TOTAL = 5;

function firstMissionLockedTooltip(audience: MissionRankAudience): string {
  return audience === "local_leader"
    ? "Complete your coach meeting to unlock this step."
    : "Complete your Mission Briefing to unlock this step.";
}

/** Display label + tooltip for step 2 (Meet Your Coach / Mission Briefing). */
export function coachMeetingStepDisplay(
  status: CoachMeetingStepStatus,
  audience: MissionRankAudience
): StepDisplay {
  if (audience === "local_leader") {
    switch (status) {
      case "locked":
        return {
          label: "Locked",
          tooltip: "Complete Biblical Citizenship to unlock this step.",
        };
      case "pending":
        return {
          label: "Schedule Your Call",
          tooltip: "Choose a convenient time to meet with a Chapter Coach.",
        };
      case "in_progress":
        return {
          label: "Appointment Scheduled",
          tooltip: "Awaiting your scheduled onboarding call.",
        };
      case "completed":
        return {
          label: "Completed",
          tooltip: "You're ready to choose your first mission.",
        };
      default:
        return { label: status, tooltip: "" };
    }
  }

  switch (status) {
    case "locked":
      return {
        label: "Locked",
        tooltip: "Complete Biblical Citizenship to unlock your Mission Briefing.",
      };
    case "pending":
      return {
        label: "Watch Briefing",
        tooltip:
          "Watch the onboarding briefing to understand your role, how the platform works, and what comes next.",
      };
    case "in_progress":
      return {
        label: "In Progress",
        tooltip: "Continue watching your Mission Briefing. Your progress is saved automatically.",
      };
    case "completed":
      return {
        label: "Completed",
        tooltip: "Mission Briefing complete. You're ready to choose your first mission.",
      };
    default:
      return { label: status, tooltip: "" };
  }
}

/** Display label + tooltip for step 3 (Choose Your First Mission). */
export function firstMissionStepDisplay(
  status: FirstMissionStepStatus,
  audience: MissionRankAudience,
  missionsCompleted = 0
): StepDisplay {
  switch (status) {
    case "locked":
      return {
        label: "Locked",
        tooltip: firstMissionLockedTooltip(audience),
      };
    case "pending":
      return {
        label: "Begin Your Missions",
        tooltip: "Complete at least 5 missions to begin making an impact in your community.",
      };
    case "in_progress": {
      const done = Math.max(0, Math.min(FIRST_MISSION_TOTAL, missionsCompleted));
      return {
        label: "In Progress",
        tooltip: `Mission progress: ${done} of ${FIRST_MISSION_TOTAL} completed`,
      };
    }
    case "completed":
      return {
        label: "Mission Ready",
        tooltip:
          "Congratulations! You've completed your initial mission assignments and are ready for the next phase.",
      };
    default:
      return { label: status, tooltip: "" };
  }
}

export function trainingStepDisplay(status: TrainingStepStatus): StepDisplay {
  switch (status) {
    case "pending":
      return {
        label: "Not started",
        tooltip: "Start Biblical Citizenship to begin your training journey.",
      };
    case "in_progress":
      return {
        label: "In Progress",
        tooltip: "Continue your Biblical Citizenship lessons. Your progress is saved automatically.",
      };
    case "completed":
      return {
        label: "Completed",
        tooltip: "Biblical Citizenship training is complete.",
      };
    default:
      return { label: status, tooltip: "" };
  }
}

export function firstMissionStepTitle(): string {
  return "Choose Your First Mission";
}
