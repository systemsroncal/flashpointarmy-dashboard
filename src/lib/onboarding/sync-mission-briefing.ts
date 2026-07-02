import { unlockFirstMissionAfterCoachMeetingCompleted } from "@/lib/onboarding/sync-coach-meeting-unlock";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Member started Mission Briefing — move onboarding step 2 to in_progress. */
export async function startMissionBriefingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("member_coach_meetings")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return;
  if (existing.status === "pending") {
    await supabase
      .from("member_coach_meetings")
      .update({ status: "in_progress", updated_at: now })
      .eq("user_id", userId);
  }
}

/** Member finished Mission Briefing — complete step 2 and unlock first mission. */
export async function completeMissionBriefingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("member_coach_meetings")
    .update({ status: "completed", updated_at: now })
    .eq("user_id", userId);

  await unlockFirstMissionAfterCoachMeetingCompleted(supabase, userId, userId);
}
