import { coachMeetingKindForAudience, coachMeetingTopic } from "@/lib/onboarding/coach-meeting-labels";
import { loadTrainingStepStatus } from "@/lib/onboarding/onboarding-records";
import { ensureCoachMeetingUnlockedAfterTraining, unlockFirstMissionAfterCoachMeetingCompleted } from "@/lib/onboarding/sync-coach-meeting-unlock";
import type { SupabaseClient } from "@supabase/supabase-js";

/** User opened Mission Briefing — ensure row exists and move to in_progress. */
export async function startMissionBriefingForUser(
  admin: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<void> {
  await ensureCoachMeetingUnlockedAfterTraining(admin, userId, roleNames);

  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("member_coach_meetings")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return;
  if (existing.status === "pending") {
    const meetingType = coachMeetingKindForAudience(
      roleNames.includes("local_leader") ? "local_leader" : "member"
    );
    const topic = coachMeetingTopic(roleNames.includes("local_leader") ? "local_leader" : "member");
    await admin
      .from("member_coach_meetings")
      .update({ status: "in_progress", meeting_type: meetingType, topic, updated_at: now })
      .eq("user_id", userId);
  }
}

/** User finished Mission Briefing — complete step 2 and unlock first mission. */
export async function completeMissionBriefingForUser(
  admin: SupabaseClient,
  userId: string,
  roleNames: string[]
): Promise<void> {
  const training = await loadTrainingStepStatus(admin, userId);
  if (training !== "completed") {
    throw new Error("Complete Biblical Citizenship first.");
  }

  await ensureCoachMeetingUnlockedAfterTraining(admin, userId, roleNames);

  const now = new Date().toISOString();
  const audience = roleNames.includes("local_leader") ? "local_leader" : "member";
  const { error } = await admin.from("member_coach_meetings").upsert(
    {
      user_id: userId,
      status: "completed",
      meeting_type: coachMeetingKindForAudience(audience),
      topic: coachMeetingTopic(audience),
      duration_minutes: 30,
      updated_at: now,
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(error.message);

  await unlockFirstMissionAfterCoachMeetingCompleted(admin, userId, userId);
}
