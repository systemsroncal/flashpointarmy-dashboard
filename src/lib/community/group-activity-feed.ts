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

/** Product copy: "Biblical Citizenship Group" (avoid double "Group"). */
export function formatGroupFeedName(name: string): string {
  const n = name.trim() || "a group";
  if (/\bgroup$/i.test(n)) return n;
  return `${n} Group`;
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

async function chapterStateForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("primary_chapter_id")
    .eq("id", userId)
    .maybeSingle();
  const chId =
    typeof prof?.primary_chapter_id === "string" ? prof.primary_chapter_id : null;
  if (!chId) return null;
  const { data: ch } = await supabase.from("chapters").select("state").eq("id", chId).maybeSingle();
  return (ch?.state as string | undefined)?.trim().toUpperCase().slice(0, 2) || null;
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
  // DB trigger migration 094 is the source of truth. Keep this application-level
  // fallback for environments where the migration is not applied yet, but avoid
  // writing a duplicate when the trigger already mirrored the same action.
  const recentCutoff = new Date(Date.now() - 10_000).toISOString();
  const { data: existing } = await supabase
    .from("community_activity")
    .select("id")
    .eq("feed_category", row.feed_category)
    .eq("title", row.title)
    .eq("actor_user_id", row.actor_user_id)
    .gte("created_at", recentCutoff)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("community_activity").insert(row);
  if (error) {
    // Never block the primary Mobilize action if the public feed write fails.
    console.error("[group-activity-feed]", error.message);
  }
}

/** Jane joined Biblical Citizenship Group */
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
    title: `${handle} joined ${formatGroupFeedName(group.name)}`,
    subtitle: "Community Activity",
    state_code: group.stateCode,
    icon_key: "groups",
    actor_user_id: args.userId,
  });
}

/**
 * John posted in Church of Champions Group /
 * Robert uploaded a photo in Men's Group (when the post has 1+ images).
 */
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
  const groupName = formatGroupFeedName(group.name);

  if (args.hasImages) {
    await insertFeedRow(args.supabase, {
      feed_category: "group_post",
      title: `${handle} uploaded a photo in ${groupName}`,
      subtitle: "Community Activity",
      state_code: group.stateCode,
      icon_key: "bolt",
      actor_user_id: args.userId,
    });
    return;
  }

  const isLeader = Boolean(args.isLeader);
  await insertFeedRow(args.supabase, {
    feed_category: isLeader ? "group_leader_post" : "group_post",
    title: `${handle} posted in ${groupName}`,
    subtitle: isLeader ? "Leader Activity" : "Community Activity",
    state_code: group.stateCode,
    icon_key: isLeader ? "megaphone" : "bolt",
    actor_user_id: args.userId,
  });
}

/** Maria commented in Families' Group / David replied to a post */
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
    ? `${handle} replied to a post`
    : `${handle} commented in ${formatGroupFeedName(group.name)}`;

  await insertFeedRow(args.supabase, {
    feed_category: args.isReply ? "group_reply" : "group_comment",
    title,
    subtitle: "Community Activity",
    state_code: group.stateCode,
    icon_key: "bolt",
    actor_user_id: args.userId,
  });
}

/** Michael liked a post */
export async function insertPostLikeActivity(args: {
  supabase: SupabaseClient;
  userId: string;
  /** Optional group context for state pin; likes stay generic in copy. */
  groupId?: string | null;
}): Promise<void> {
  const who = await loadUserDisplay(args.supabase, args.userId);
  const handle = displayHandle(who.first, who.last, who.email);
  let stateCode: string | null = null;
  if (args.groupId) {
    const group = await loadGroupMeta(args.supabase, args.groupId);
    stateCode = group?.stateCode ?? null;
  } else {
    stateCode = await chapterStateForUser(args.supabase, args.userId);
  }

  await insertFeedRow(args.supabase, {
    feed_category: "group_like",
    title: `${handle} liked a post`,
    subtitle: "Community Activity",
    state_code: stateCode,
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
  const stateCode = await chapterStateForUser(args.supabase, args.followerId);

  await insertFeedRow(args.supabase, {
    feed_category: "social_follow",
    title: `${who} started following ${target}`,
    subtitle: "Social Connections",
    state_code: stateCode,
    icon_key: "person",
    actor_user_id: args.followerId,
  });
}

/** Jane updated profile information */
export async function insertProfileUpdateActivity(args: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<void> {
  const who = await loadUserDisplay(args.supabase, args.userId);
  const handle = displayHandle(who.first, who.last, who.email);
  const stateCode = await chapterStateForUser(args.supabase, args.userId);

  await insertFeedRow(args.supabase, {
    feed_category: "profile_update",
    title: `${handle} updated profile information`,
    subtitle: "Social Connections",
    state_code: stateCode,
    icon_key: "person",
    actor_user_id: args.userId,
  });
}

/**
 * Robert received five profile endorsements.
 * Fires once when distinct likers across the author's profile posts reach 5+.
 * (Profile "likes" are the product stand-in until a dedicated endorsements table exists.)
 */
export async function maybeInsertProfileEndorsementMilestone(args: {
  supabase: SupabaseClient;
  profileOwnerId: string;
}): Promise<void> {
  const { data: posts } = await args.supabase
    .from("mobilize_profile_posts")
    .select("id")
    .eq("author_id", args.profileOwnerId)
    .limit(200);
  const postIds = (posts ?? []).map((p) => p.id as string);
  if (!postIds.length) return;

  const { data: reactions } = await args.supabase
    .from("mobilize_profile_post_reactions")
    .select("user_id")
    .in("post_id", postIds)
    .neq("user_id", args.profileOwnerId);

  const distinct = new Set((reactions ?? []).map((r) => r.user_id as string));
  if (distinct.size < 5) return;

  const { data: existing } = await args.supabase
    .from("community_activity")
    .select("id")
    .eq("actor_user_id", args.profileOwnerId)
    .eq("feed_category", "profile_endorsements")
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const who = await loadUserDisplay(args.supabase, args.profileOwnerId);
  const handle = displayHandle(who.first, who.last, who.email);
  const stateCode = await chapterStateForUser(args.supabase, args.profileOwnerId);

  await insertFeedRow(args.supabase, {
    feed_category: "profile_endorsements",
    title: `${handle} received five profile endorsements.`,
    subtitle: "Social Connections",
    state_code: stateCode,
    icon_key: "star",
    actor_user_id: args.profileOwnerId,
  });
}

/** Emily invited friends to join Church Of Champions Group */
export async function insertGroupInviteShareActivity(args: {
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
    feed_category: "group_invite_share",
    title: `${handle} invited friends to join ${formatGroupFeedName(group.name)}`,
    subtitle: "Social Connections",
    state_code: group.stateCode,
    icon_key: "celebration",
    actor_user_id: args.userId,
  });
}
