import type { SupabaseClient } from "@supabase/supabase-js";
import { formatPrivacyName } from "@/lib/user/format-privacy-name";

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

function displayHandle(
  first: string | null | undefined,
  last: string | null | undefined,
  email: string
): string {
  const privacy = formatPrivacyName(first, last);
  if (privacy !== "A member") return privacy;
  return email.split("@")[0] || "A member";
}

async function loadGroupMeta(
  supabase: SupabaseClient,
  groupId: string
): Promise<{ name: string; stateCode: string | null } | null> {
  const { data: group } = await supabase
    .from("mobilize_groups")
    .select("id, name, region_code, parent_group_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  const name = String((group as { name?: string }).name ?? "a group").trim() || "a group";
  let stateCode: string | null = null;
  const region = String((group as { region_code?: string | null }).region_code ?? "")
    .trim()
    .toUpperCase();
  if (/^[A-Z]{2}$/.test(region)) {
    stateCode = region;
  } else {
    const parentId = (group as { parent_group_id?: string | null }).parent_group_id;
    if (parentId) {
      const { data: parent } = await supabase
        .from("mobilize_groups")
        .select("region_code")
        .eq("id", parentId)
        .maybeSingle();
      const parentRegion = String(parent?.region_code ?? "")
        .trim()
        .toUpperCase();
      if (/^[A-Z]{2}$/.test(parentRegion)) stateCode = parentRegion;
    }
  }

  return { name, stateCode };
}

async function insertFeedRow(
  supabase: SupabaseClient,
  row: {
    feed_category: string;
    title: string;
    subtitle: string;
    state_code: string | null;
    icon_key: string;
    actor_user_id: string;
  }
): Promise<void> {
  const { error } = await supabase.from("community_activity").insert(row);
  if (error) {
    // Never block the primary Mobilize action if the public feed write fails.
    console.error("[group-activity-feed]", error.message);
  }
}

/** Jane joined Prayer Team – Florida */
export async function insertGroupJoinActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  groupId: string;
}): Promise<void> {
  const [who, group] = await Promise.all([
    loadUserDisplay(args.supabase, args.userId),
    loadGroupMeta(args.supabase, args.groupId),
  ]);
  if (!group) return;
  const handle = displayHandle(who.first, who.last, who.email);
  await insertFeedRow(args.supabase, {
    feed_category: "group_join",
    title: `${handle} joined ${group.name}`,
    subtitle: "Community Activity",
    state_code: group.stateCode,
    icon_key: "groups",
    actor_user_id: args.userId,
  });
}

/** John posted in Church of Champions / Robert uploaded a photo */
export async function insertGroupPostActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  groupId: string;
  hasText: boolean;
  hasImages: boolean;
  isLeader?: boolean;
}): Promise<void> {
  const [who, group] = await Promise.all([
    loadUserDisplay(args.supabase, args.userId),
    loadGroupMeta(args.supabase, args.groupId),
  ]);
  if (!group) return;
  const handle = displayHandle(who.first, who.last, who.email);

  let title: string;
  if (!args.hasText && args.hasImages) {
    title = `${handle} uploaded a photo in ${group.name}`;
  } else if (args.isLeader) {
    title = `${handle} posted in ${group.name}`;
  } else {
    title = `${handle} posted in ${group.name}`;
  }

  await insertFeedRow(args.supabase, {
    feed_category: args.isLeader ? "group_leader_post" : "group_post",
    title,
    subtitle: args.isLeader ? "Leader Activity" : "Community Activity",
    state_code: group.stateCode,
    icon_key: args.isLeader ? "megaphone" : "bolt",
    actor_user_id: args.userId,
  });
}

/** Maria commented in Families of Texas / David replied to a discussion */
export async function insertGroupCommentActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  groupId: string;
  isReply: boolean;
}): Promise<void> {
  const [who, group] = await Promise.all([
    loadUserDisplay(args.supabase, args.userId),
    loadGroupMeta(args.supabase, args.groupId),
  ]);
  if (!group) return;
  const handle = displayHandle(who.first, who.last, who.email);
  const title = args.isReply
    ? `${handle} replied to a discussion in ${group.name}`
    : `${handle} commented in ${group.name}`;

  await insertFeedRow(args.supabase, {
    feed_category: args.isReply ? "group_reply" : "group_comment",
    title,
    subtitle: "Community Activity",
    state_code: group.stateCode,
    icon_key: "bolt",
    actor_user_id: args.userId,
  });
}

/** Rose started following Gene Bailey */
export async function insertSocialFollowActivity(args: {
  supabase: SupabaseClient;
  followerId: string;
  followingId: string;
}): Promise<void> {
  const [follower, following] = await Promise.all([
    loadUserDisplay(args.supabase, args.followerId),
    loadUserDisplay(args.supabase, args.followingId),
  ]);
  const who = displayHandle(follower.first, follower.last, follower.email);
  const target = displayHandle(following.first, following.last, following.email);

  let stateCode: string | null = null;
  const { data: prof } = await args.supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", args.followerId)
    .maybeSingle();
  const chId =
    typeof prof?.primary_chapter_id === "string" ? prof.primary_chapter_id : null;
  if (chId) {
    const { data: ch } = await args.supabase
      .from("chapters")
      .select("state")
      .eq("id", chId)
      .maybeSingle();
    stateCode = (ch?.state as string | undefined)?.trim().toUpperCase().slice(0, 2) || null;
  }

  await insertFeedRow(args.supabase, {
    feed_category: "social_follow",
    title: `${who} started following ${target}`,
    subtitle: "Social Connections",
    state_code: stateCode,
    icon_key: "person",
    actor_user_id: args.followerId,
  });
}
