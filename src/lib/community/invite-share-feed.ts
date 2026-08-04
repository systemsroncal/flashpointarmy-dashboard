import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrivacyName } from "@/lib/user/format-privacy-name";

export const INVITE_SHARE_CHANNELS = [
  "whatsapp",
  "facebook",
  "x",
  "linkedin",
  "telegram",
  "email",
  "direct_link",
] as const;

export type InviteShareChannel = (typeof INVITE_SHARE_CHANNELS)[number];

const CHANNEL_THROUGH_LABELS: Record<InviteShareChannel, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  email: "Email",
  direct_link: "the invite link",
};

export function inviteShareChannelLabel(channel: InviteShareChannel): string {
  return CHANNEL_THROUGH_LABELS[channel];
}

export function isInviteShareChannel(value: string): value is InviteShareChannel {
  return (INVITE_SHARE_CHANNELS as readonly string[]).includes(value);
}

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

function displayHandle(
  first: string | null | undefined,
  last: string | null | undefined,
  email: string
): string {
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
    supabase
      .from("dashboard_users")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle(),
  ]);
  return {
    first: (prof?.first_name as string | null) ?? (du?.first_name as string | null) ?? null,
    last: (prof?.last_name as string | null) ?? (du?.last_name as string | null) ?? null,
    email: (du?.email as string | undefined) ?? "",
  };
}

/** Community in Action row when a member shares the 20k invite link. */
export async function insertInviteShareActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  channel: InviteShareChannel;
}): Promise<void> {
  const { error: trackErr } = await args.supabase.from("invite_share_events").insert({
    user_id: args.userId,
    channel: args.channel,
  });
  // If migration 079 is not applied yet, still write the feed event.
  if (trackErr && !/relation .*invite_share_events.* does not exist|Could not find the table/i.test(trackErr.message)) {
    throw new Error(trackErr.message);
  }

  const { first, last, email } = await loadUserDisplay(args.supabase, args.userId);
  const who = displayHandle(first, last, email);
  const state = await chapterStateFromProfile(args.supabase, args.userId);
  const via = inviteShareChannelLabel(args.channel);
  const through =
    args.channel === "direct_link" ? "by copying the invite link" : `through ${via}`;

  const { error } = await args.supabase.from("community_activity").insert({
    feed_category: "member_invite",
    title: `🎉 ${who} helped grow FlashPoint Army ${through}!`,
    subtitle: "Thank you for inviting others to join the community",
    state_code: state,
    icon_key: "celebration",
    actor_user_id: args.userId,
  });
  if (error) throw new Error(error.message);
}
