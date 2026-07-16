import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichGroupMessages } from "@/lib/mobilize/social/enrich-group-messages";
import type { RecommendedUser, UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { isFollowingUser } from "@/lib/mobilize/social/profile-access";

export type HomeFeedScope = "for_you" | "following" | "groups";

export type HomeFeedResult = {
  posts: UnifiedFeedPost[];
  mode: "following" | "recommended";
  recommendations: RecommendedUser[];
  scope: HomeFeedScope;
};

export async function loadMobilizeHomeFeed(
  admin: SupabaseClient,
  viewerId: string,
  limit = 40,
  scope: HomeFeedScope = "for_you"
): Promise<HomeFeedResult> {
  const { data: memberships } = await admin
    .from("mobilize_group_members")
    .select("group_id")
    .eq("user_id", viewerId)
    .eq("membership_status", "approved");

  const groupIds = [...new Set((memberships ?? []).map((m) => m.group_id as string))];

  const { data: followRows } = await admin
    .from("mobilize_user_follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  const followingIds = [...new Set((followRows ?? []).map((r) => r.following_id as string))];

  const [groupMessages, profilePosts, recommendations] = await Promise.all([
    scope === "following"
      ? Promise.resolve([])
      : loadGroupMessages(admin, viewerId, groupIds, limit, scope === "for_you"),
    scope === "groups"
      ? Promise.resolve([])
      : scope === "following"
        ? loadProfilePosts(admin, viewerId, followingIds, limit, false)
        : loadProfilePosts(admin, viewerId, followingIds, limit, true),
    loadRecommendations(admin, viewerId, groupIds, followingIds),
  ]);

  let merged: UnifiedFeedPost[];
  if (scope === "groups") {
    merged = groupMessages;
  } else if (scope === "following") {
    merged = profilePosts;
  } else {
    merged = [...groupMessages, ...profilePosts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const posts = merged.slice(0, limit);
  const mode =
    followingIds.length > 0 || (groupIds.length > 0 && groupMessages.length > 0)
      ? "following"
      : "recommended";

  if (posts.length || scope !== "for_you") {
    return { posts, mode, recommendations, scope };
  }

  const fallbackGroupMessages = await loadGroupMessages(admin, viewerId, groupIds, limit, true);
  return {
    posts: fallbackGroupMessages.slice(0, limit),
    mode: "recommended",
    recommendations,
    scope,
  };
}

async function loadGroupMessages(
  admin: SupabaseClient,
  viewerId: string,
  groupIds: string[],
  limit: number,
  allGroups = false
): Promise<UnifiedFeedPost[]> {
  if (!groupIds.length) return [];

  let q = admin
    .from("mobilize_group_messages")
    .select("id, group_id, author_id, content, content_html, comments_policy, image_urls, created_at")
    .in("group_id", groupIds)
    .order("created_at", { ascending: false })
    .limit(allGroups ? limit : Math.min(limit, 30));

  const { data: rows } = await q;
  if (!rows?.length) return [];

  const { data: groups } = await admin
    .from("mobilize_groups")
    .select("id, name")
    .in("id", [...new Set(rows.map((r) => r.group_id as string))]);

  const groupNameById = new Map((groups ?? []).map((g) => [g.id as string, g.name as string]));
  const enriched = await enrichGroupMessages(admin, viewerId, rows);

  return enriched.map((m) => ({
    id: `gm-${m.id}`,
    kind: "group_message" as const,
    created_at: m.created_at,
    author: m.author,
    content: m.content,
    content_html: m.content_html,
    image_urls: m.image_urls,
    reactions: m.reactions,
    comment_count: m.comment_count,
    comments_policy: m.comments_policy,
    group_id: m.group_id,
    message_id: m.id,
    group: { id: m.group_id, name: groupNameById.get(m.group_id) ?? "Group" },
  }));
}

async function loadProfilePosts(
  admin: SupabaseClient,
  viewerId: string,
  followingIds: string[],
  limit: number,
  includeOwn = true
): Promise<UnifiedFeedPost[]> {
  const authorIds = includeOwn
    ? [...new Set([viewerId, ...followingIds])]
    : [...new Set(followingIds)];
  if (!authorIds.length) return [];

  const { data: rows } = await admin
    .from("mobilize_profile_posts")
    .select("id, author_id, content, content_html, image_urls, created_at")
    .in("author_id", authorIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return [];

  const postIds = rows.map((r) => r.id as string);
  const authorIdsInPosts = rows.map((r) => r.author_id as string);
  const [authors, { data: reactions }, { data: comments }] = await Promise.all([
    resolveMobilizeAuthors(admin, authorIdsInPosts),
    admin
      .from("mobilize_profile_post_reactions")
      .select("post_id, user_id, reaction_type")
      .in("post_id", postIds),
    admin.from("mobilize_profile_post_comments").select("post_id").in("post_id", postIds),
  ]);

  const reactionsByPost = new Map<string, { reaction_type: string }[]>();
  const viewerByPost = new Map<string, ReactionType>();
  for (const r of reactions ?? []) {
    const pid = r.post_id as string;
    const list = reactionsByPost.get(pid) ?? [];
    list.push({ reaction_type: r.reaction_type as string });
    reactionsByPost.set(pid, list);
    if (r.user_id === viewerId) viewerByPost.set(pid, r.reaction_type as ReactionType);
  }
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) {
    const pid = c.post_id as string;
    commentCount.set(pid, (commentCount.get(pid) ?? 0) + 1);
  }

  return rows.map((row) => {
    const id = row.id as string;
    const authorId = row.author_id as string;
    const author = authors.get(authorId)!;
    return {
      id: `pp-${id}`,
      kind: "profile_post" as const,
      created_at: row.created_at as string,
      author,
      content: row.content as string,
      content_html: (row.content_html as string | null) ?? null,
      image_urls: (row.image_urls as string[]) ?? [],
      reactions: summarizeReactions(reactionsByPost.get(id) ?? [], viewerByPost.get(id) ?? null),
      comment_count: commentCount.get(id) ?? 0,
      profile_user_id: authorId,
      post_id: id,
    };
  });
}

async function loadRecommendations(
  admin: SupabaseClient,
  viewerId: string,
  groupIds: string[],
  followingIds: string[]
): Promise<RecommendedUser[]> {
  if (!groupIds.length) return [];

  const { data: coMembers } = await admin
    .from("mobilize_group_members")
    .select("user_id")
    .in("group_id", groupIds)
    .eq("membership_status", "approved")
    .neq("user_id", viewerId)
    .limit(40);

  const candidateIds = [
    ...new Set(
      (coMembers ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => !followingIds.includes(id))
    ),
  ].slice(0, 8);

  if (!candidateIds.length) return [];

  const authors = await resolveMobilizeAuthors(admin, candidateIds);
  const results: RecommendedUser[] = [];
  for (const id of candidateIds) {
    const author = authors.get(id);
    if (!author) continue;
    const { count } = await admin
      .from("mobilize_user_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", id);
    const isFollowing = await isFollowingUser(admin, viewerId, id);
    results.push({
      ...author,
      followers_count: count ?? 0,
      is_following: isFollowing,
    });
  }
  return results;
}
