import { DASHBOARD_WELCOME_VIDEO_URL } from "@/lib/dashboard/welcome-video";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MissionBriefingProgressRow = {
  user_id: string;
  video_position_seconds: number;
  video_duration_seconds: number | null;
  updated_at: string;
};

export async function loadBriefingVideoUrl(supabase: SupabaseClient): Promise<string> {
  const envFallback = process.env.NEXT_PUBLIC_TRAINING_INTRO_VIDEO?.trim() ?? "";
  const { data } = await supabase
    .from("training_settings")
    .select("briefing_video_url, intro_video_url")
    .eq("id", 1)
    .maybeSingle();

  const briefing = (data?.briefing_video_url as string | null | undefined)?.trim() ?? "";
  if (briefing) return briefing;

  const intro = (data?.intro_video_url as string | null | undefined)?.trim() ?? "";
  if (intro) return intro;

  if (envFallback) return envFallback;
  return DASHBOARD_WELCOME_VIDEO_URL;
}

export async function loadMissionBriefingProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<MissionBriefingProgressRow | null> {
  const { data } = await supabase
    .from("member_mission_briefing_progress")
    .select("user_id, video_position_seconds, video_duration_seconds, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as MissionBriefingProgressRow | null) ?? null;
}
