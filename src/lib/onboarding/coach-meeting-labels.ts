import type { MissionRankAudience } from "@/lib/onboarding/member-onboarding-status";

export type CoachMeetingKind = "coach_meeting" | "onboarding_call";

export function coachMeetingKindForAudience(audience: MissionRankAudience): CoachMeetingKind {
  return audience === "local_leader" ? "coach_meeting" : "onboarding_call";
}

export function coachMeetingStepTitle(audience: MissionRankAudience): string {
  return audience === "local_leader" ? "Meet Your Coach" : "Mission Briefing";
}

export function coachMeetingStepHref(audience: MissionRankAudience): string {
  return audience === "local_leader"
    ? "/dashboard/training/coach-meeting"
    : "/dashboard/training/mission-briefing";
}

export function coachMeetingScheduleLabel(audience: MissionRankAudience): string {
  return audience === "local_leader" ? "Schedule Your Call" : "Watch Mission Briefing";
}

export function coachMeetingTopic(audience: MissionRankAudience): string {
  return audience === "local_leader" ? "Coach Meeting" : "Mission Briefing";
}

export function coachMeetingTypeLabel(meetingType: CoachMeetingKind | string | null | undefined): string {
  if (meetingType === "coach_meeting") return "Coach Meeting";
  if (meetingType === "onboarding_call") return "Mission Briefing";
  return "—";
}

export function coachMeetingRoleTag(meetingType: CoachMeetingKind | string | null | undefined): string {
  if (meetingType === "coach_meeting") return "Local leader";
  if (meetingType === "onboarding_call") return "Member";
  return "—";
}
