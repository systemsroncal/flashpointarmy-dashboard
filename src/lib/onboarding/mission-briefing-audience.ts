import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";

/** Members and local leaders use the Mission Briefing video step (not coach booking). */
export function isMissionBriefingAudience(roleNames: string[]): boolean {
  return isMemberOnboardingAudience(roleNames);
}
