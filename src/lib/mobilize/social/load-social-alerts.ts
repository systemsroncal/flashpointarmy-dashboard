import type { SupabaseClient } from "@supabase/supabase-js";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";

export type SocialAlertKind =
  | "follow"
  | "like_profile_post"
  | "like_group_post"
  | "comment_profile_post"
  | "comment_group_post"
  | "followed_profile_post"
  | "followed_group_post";

export type SocialAlert = {
  id: string;
  kind: SocialAlertKind;
  created_at: string;
  actor: MobilizeAuthorSummary;
  summary: string;
  href: string | null;
};

/**
 * Activity feed for the signed-in user: follows, likes, comments on their content,
 * and new posts from people they follow.
 */
export async function loadMobilizeSocialAlerts(
  admin: SupabaseClient,
  viewerId: string,
  limit = 40
): Promise<SocialAlert[]> {
  const fetchCap = Math.min(80, Math.max(limit * 2, limit));

  const [
    { data: followRows },
    { data: myPosts },
    { data: myMessages },
    { data: followingRows },
  ] = await Promise.all([
    admin
      .from("mobilize_user_follows")
      .select("follower_id, created_at")
      .eq("following_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(fetchCap),
    admin.from("mobilize_profile_posts").select("id").eq("author_id", viewerId),
    admin.from("mobilize_group_messages").select("id, group_id").eq("author_id", viewerId),
    admin
      .from("mobilize_user_follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .limit(200),
  ]);

  const myPostIds = (myPosts ?? []).map((r) => r.id as string);
  const myMessageRows = (myMessages ?? []) as Array<{ id: string; group_id: string }>;
  const myMessageIds = myMessageRows.map((r) => r.id);
  const messageGroupById = new Map(myMessageRows.map((r) => [r.id, r.group_id]));
  const followingIds = (followingRows ?? []).map((r) => r.following_id as string);

  const [
    { data: postReactions },
    { data: messageReactions },
    { data: profileComments },
    { data: messageComments },
    { data: followedProfilePosts },
    { data: followedGroupPosts },
  ] = await Promise.all([
    myPostIds.length
      ? admin
          .from("mobilize_profile_post_reactions")
          .select("post_id, user_id, reaction_type, created_at")
          .in("post_id", myPostIds)
          .neq("user_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    myMessageIds.length
      ? admin
          .from("mobilize_message_reactions")
          .select("message_id, user_id, reaction_type, created_at")
          .in("message_id", myMessageIds)
          .neq("user_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    myPostIds.length
      ? admin
          .from("mobilize_profile_post_comments")
          .select("id, post_id, author_id, created_at")
          .in("post_id", myPostIds)
          .neq("author_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    myMessageIds.length
      ? admin
          .from("mobilize_message_comments")
          .select("id, message_id, author_id, created_at")
          .in("message_id", myMessageIds)
          .neq("author_id", viewerId)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    followingIds.length
      ? admin
          .from("mobilize_profile_posts")
          .select("id, author_id, created_at")
          .in("author_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    followingIds.length
      ? admin
          .from("mobilize_group_messages")
          .select("id, group_id, author_id, created_at")
          .in("author_id", followingIds)
          .order("created_at", { ascending: false })
          .limit(fetchCap)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const actorIds = new Set<string>();
  for (const row of followRows ?? []) actorIds.add(row.follower_id as string);
  for (const row of postReactions ?? []) actorIds.add(row.user_id as string);
  for (const row of messageReactions ?? []) actorIds.add(row.user_id as string);
  for (const row of profileComments ?? []) actorIds.add(row.author_id as string);
  for (const row of messageComments ?? []) actorIds.add(row.author_id as string);
  for (const row of followedProfilePosts ?? []) actorIds.add(row.author_id as string);
  for (const row of followedGroupPosts ?? []) actorIds.add(row.author_id as string);

  const authors = await resolveMobilizeAuthors(admin, [...actorIds]);
  const alerts: SocialAlert[] = [];

  for (const row of followRows ?? []) {
    const actor = authors.get(row.follower_id as string);
    if (!actor) continue;
    alerts.push({
      id: `follow-${row.follower_id}-${row.created_at}`,
      kind: "follow",
      created_at: row.created_at as string,
      actor,
      summary: "started following you",
      href: mobilizeMemberProfileHref(actor.id),
    });
  }

  for (const row of postReactions ?? []) {
    const actor = authors.get(row.user_id as string);
    if (!actor) continue;
    const reaction = row.reaction_type === "love" ? "loved" : "liked";
    alerts.push({
      id: `ppr-${row.post_id}-${row.user_id}`,
      kind: "like_profile_post",
      created_at: row.created_at as string,
      actor,
      summary: `${reaction} your post`,
      href: mobilizeMemberProfileHref(viewerId),
    });
  }

  for (const row of messageReactions ?? []) {
    const actor = authors.get(row.user_id as string);
    if (!actor) continue;
    const reaction = row.reaction_type === "love" ? "loved" : "liked";
    const groupId = messageGroupById.get(row.message_id as string);
    alerts.push({
      id: `gmr-${row.message_id}-${row.user_id}`,
      kind: "like_group_post",
      created_at: row.created_at as string,
      actor,
      summary: `${reaction} your group post`,
      href: groupId ? mobilizeGroupDetailHref(groupId) : null,
    });
  }

  for (const row of profileComments ?? []) {
    const actor = authors.get(row.author_id as string);
    if (!actor) continue;
    alerts.push({
      id: `ppc-${row.id}`,
      kind: "comment_profile_post",
      created_at: row.created_at as string,
      actor,
      summary: "commented on your post",
      href: mobilizeMemberProfileHref(viewerId),
    });
  }

  for (const row of messageComments ?? []) {
    const actor = authors.get(row.author_id as string);
    if (!actor) continue;
    const groupId = messageGroupById.get(row.message_id as string);
    alerts.push({
      id: `gmc-${row.id}`,
      kind: "comment_group_post",
      created_at: row.created_at as string,
      actor,
      summary: "commented on your group post",
      href: groupId ? mobilizeGroupDetailHref(groupId) : null,
    });
  }

  for (const row of followedProfilePosts ?? []) {
    const actor = authors.get(row.author_id as string);
    if (!actor) continue;
    alerts.push({
      id: `fpp-${row.id}`,
      kind: "followed_profile_post",
      created_at: row.created_at as string,
      actor,
      summary: "shared a new post",
      href: mobilizeMemberProfileHref(actor.id),
    });
  }

  for (const row of followedGroupPosts ?? []) {
    const actor = authors.get(row.author_id as string);
    if (!actor) continue;
    alerts.push({
      id: `fgp-${row.id}`,
      kind: "followed_group_post",
      created_at: row.created_at as string,
      actor,
      summary: "posted in a group",
      href: mobilizeGroupDetailHref(row.group_id as string),
    });
  }

  return alerts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}
