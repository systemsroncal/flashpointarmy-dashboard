import { coachMeetingStepHref } from "@/lib/onboarding/coach-meeting-labels";
import type { MemberOnboardingSnapshot } from "@/lib/onboarding/member-onboarding-status";

export type OnboardingNavStepKey = "training" | "coachMeeting" | "firstMission";

/** Href for the actionable status label (Watch Briefing, Schedule Your Call, etc.). */
export function resolveOnboardingStepStatusHref(
  stepKey: OnboardingNavStepKey,
  snapshot: MemberOnboardingSnapshot
): string | null {
  if (stepKey === "training") {
    return snapshot.training === "completed" ? null : "/dashboard/training";
  }

  if (stepKey === "coachMeeting") {
    if (snapshot.training !== "completed") return null;
    if (snapshot.coachMeeting === "locked") return null;
    return coachMeetingStepHref(snapshot.rankAudience);
  }

  if (stepKey === "firstMission") {
    if (snapshot.coachMeeting !== "completed") return null;
    if (snapshot.firstMission === "locked") return null;
    return "/dashboard/missions";
  }

  return null;
}
