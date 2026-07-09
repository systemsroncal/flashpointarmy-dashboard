import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrivacyName } from "@/lib/user/format-privacy-name";

async function chapterStateFromProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", userId)
    .maybeSingle();
  const chId =
    typeof prof?.primary_chapter_id === "string" && prof.primary_chapter_id.length >= 32
      ? prof.primary_chapter_id
      : null;
  if (!chId) return null;
  const { data: ch } = await supabase.from("chapters").select("state").eq("id", chId).maybeSingle();
  const st = (ch?.state as string | undefined)?.trim().toUpperCase().slice(0, 2);
  return st || null;
}

function displayHandle(first: string | null | undefined, last: string | null | undefined, email: string): string {
  const privacy = formatPrivacyName(first, last);
  if (privacy !== "A member") return privacy;
  return email.split("@")[0] || "User";
}

async function loadUserDisplay(
  supabase: SupabaseClient,
  userId: string
): Promise<{ first: string | null; last: string | null; email: string }> {
  const [{ data: prof }, { data: du }] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
    supabase.from("dashboard_users").select("first_name, last_name, email").eq("id", userId).maybeSingle(),
  ]);
  return {
    first: (prof?.first_name as string | null) ?? (du?.first_name as string | null) ?? null,
    last: (prof?.last_name as string | null) ?? (du?.last_name as string | null) ?? null,
    email: (du?.email as string | undefined) ?? "",
  };
}

/** Community feed + system notification event for journey milestones. */
export async function insertJourneyActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  kind:
    | "mission_briefing_started"
    | "mission_briefing_completed"
    | "missions_started";
}): Promise<void> {
  const { first, last, email } = await loadUserDisplay(args.supabase, args.userId);
  const who = displayHandle(first, last, email);
  const state = await chapterStateFromProfile(args.supabase, args.userId);

  const copy =
    args.kind === "mission_briefing_started"
      ? {
          title: `${who} started Mission Briefing`,
          subtitle: "Training · Mission Briefing",
          feedCategory: "training_briefing",
          notifTitle: "Mission Briefing started",
          notifBody: `${who} started Mission Briefing.`,
        }
      : args.kind === "mission_briefing_completed"
        ? {
            title: `${who} completed Mission Briefing`,
            subtitle: "Training · Mission Briefing",
            feedCategory: "training_briefing",
            notifTitle: "Mission Briefing completed",
            notifBody: `${who} completed Mission Briefing.`,
          }
        : {
            title: `${who} started the 12 Missions`,
            subtitle: "Missions",
            feedCategory: "missions",
            notifTitle: "Missions started",
            notifBody: `${who} started the 12 Missions.`,
          };

  await args.supabase.from("community_activity").insert({
    feed_category: copy.feedCategory,
    title: copy.title,
    subtitle: copy.subtitle,
    state_code: state,
    icon_key: "flag",
  });

  await args.supabase.from("notification_events").insert({
    title: copy.notifTitle,
    body: copy.notifBody,
  });
}
