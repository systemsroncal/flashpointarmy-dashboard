import type { MissionRankAudience } from "@/lib/onboarding/member-onboarding-status";

export type CoachMeetingKind = "coach_meeting" | "onboarding_call";

export function coachMeetingKindForAudience(audience: MissionRankAudience): CoachMeetingKind {
  return audience === "local_leader" ? "coach_meeting" : "onboarding_call";
}

export function coachMeetingStepTitle(_audience?: MissionRankAudience): string {
  return "Mission Briefing";
}

export function coachMeetingStepHref(_audience?: MissionRankAudience): string {
  return "/dashboard/training/mission-briefing";
}

export function coachMeetingScheduleLabel(_audience?: MissionRankAudience): string {
  return "Watch Mission Briefing";
}

export function coachMeetingTopic(_audience?: MissionRankAudience): string {
  return "Mission Briefing";
}

export function coachMeetingTypeLabel(meetingType: CoachMeetingKind | string | null | undefined): string {
  if (meetingType === "coach_meeting") return "Mission Briefing";
  if (meetingType === "onboarding_call") return "Mission Briefing";
  return "—";
}

export function coachMeetingRoleTag(meetingType: CoachMeetingKind | string | null | undefined): string {
  if (meetingType === "coach_meeting") return "Local leader";
  if (meetingType === "onboarding_call") return "Member";
  return "—";
}
