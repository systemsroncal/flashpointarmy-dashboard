import {
  coachMeetingKindForAudience,
  coachMeetingTopic,
} from "@/lib/onboarding/coach-meeting-labels";
import type { MissionRankAudience } from "@/lib/onboarding/member-onboarding-status";
import { loadTrainingStepStatus } from "@/lib/onboarding/onboarding-records";
import type { SupabaseClient } from "@supabase/supabase-js";

function audienceFromRoleNames(roleNames: string[]): MissionRankAudience {
  return roleNames.includes("local_leader") ? "local_leader" : "member";
}

/** When Biblical Citizenship is 100% complete, unlock coach meeting / onboarding call (pending). */
export async function ensureCoachMeetingUnlockedAfterTraining(
  supabase: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<void> {
  const training = await loadTrainingStepStatus(supabase, userId);
  if (training !== "completed") return;

  const audience = audienceFromRoleNames(roleNames);
  const meetingType = coachMeetingKindForAudience(audience);
  const topic = coachMeetingTopic(audience);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("member_coach_meetings")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("member_coach_meetings").upsert({
      user_id: userId,
      status: "pending",
      meeting_type: meetingType,
      topic,
      duration_minutes: 30,
      updated_at: now,
    });
    return;
  }

  if (existing.status === "locked") {
    await supabase
      .from("member_coach_meetings")
      .update({
        status: "pending",
        meeting_type: meetingType,
        topic,
        updated_at: now,
      })
      .eq("user_id", userId);
  }
}

/** Unlocks first mission step when admin marks coach meeting completed. */
export async function unlockFirstMissionAfterCoachMeetingCompleted(
  admin: SupabaseClient,
  userId: string,
  updatedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("member_first_missions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing || existing.status === "locked") {
    await admin.from("member_first_missions").upsert({
      user_id: userId,
      status: "pending",
      updated_by: updatedBy,
      updated_at: now,
    });
  }
}
