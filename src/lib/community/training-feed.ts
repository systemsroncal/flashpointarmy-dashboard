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

/**
 * Writes to `community_activity` for Training (RLS allows authenticated inserts).
 */
export async function insertCourseSessionCompletedFeed(args: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  sessionTitle: string;
  courseTitle: string;
}): Promise<void> {
  const who = displayHandle(args.first_name, args.last_name, args.email);
  const state = await chapterStateFromProfile(args.supabase, args.userId);
  const subtitle = `"${args.sessionTitle}" · ${args.courseTitle}`;
  await args.supabase.from("community_activity").insert({
    feed_category: "training_session",
    title: `${who} completed a session`,
    subtitle,
    state_code: state,
    icon_key: "school",
  });
}

export async function insertCourseCompletedFeed(args: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  courseTitle: string;
}): Promise<void> {
  const who = displayHandle(args.first_name, args.last_name, args.email);
  const state = await chapterStateFromProfile(args.supabase, args.userId);
  await args.supabase.from("community_activity").insert({
    feed_category: "training_course",
    title: `${who} finished a course`,
    subtitle: args.courseTitle,
    state_code: state,
    icon_key: "school",
  });
}
