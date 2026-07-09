import type { SupabaseClient } from "@supabase/supabase-js";

export type JourneyMilestones = {
  mission_briefing_welcome_seen_at: string | null;
  missions_welcome_seen_at: string | null;
  mission_briefing_started_notified_at: string | null;
  missions_started_notified_at: string | null;
};

export async function loadJourneyMilestones(
  supabase: SupabaseClient,
  userId: string
): Promise<JourneyMilestones | null> {
  const { data } = await supabase
    .from("member_journey_milestones")
    .select(
      "mission_briefing_welcome_seen_at, missions_welcome_seen_at, mission_briefing_started_notified_at, missions_started_notified_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data as JourneyMilestones | null) ?? null;
}
