import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichGroupMessages } from "@/lib/mobilize/social/enrich-group-messages";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

export async function loadMobilizeBookmarks(
  admin: SupabaseClient,
  viewerId: string,
  limit = 40
): Promise<UnifiedFeedPost[]> {
  const { data: marks } = await admin
    .from("mobilize_social_bookmarks")
    .select("post_kind, post_ref_id, created_at")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!marks?.length) return [];

  const profileIds = marks.filter((m) => m.post_kind === "profile_post").map((m) => m.post_ref_id as string);
  const messageIds = marks.filter((m) => m.post_kind === "group_message").map((m) => m.post_ref_id as string);

  const [profilePosts, groupPosts] = await Promise.all([
    loadBookmarkedProfilePosts(admin, viewerId, profileIds),
    loadBookmarkedGroupMessages(admin, viewerId, messageIds),
  ]);

  const byKey = new Map<string, UnifiedFeedPost>();
  for (const p of [...profilePosts, ...groupPosts]) byKey.set(p.id, p);

  const ordered: UnifiedFeedPost[] = [];
  for (const m of marks) {
    const key = m.post_kind === "profile_post" ? `pp-${m.post_ref_id}` : `gm-${m.post_ref_id}`;
    const post = byKey.get(key);
    if (post) ordered.push(post);
  }
  return ordered;
}

async function loadBookmarkedProfilePosts(
  admin: SupabaseClient,
  viewerId: string,
  postIds: string[]
): Promise<UnifiedFeedPost[]> {
  if (!postIds.length) return [];
  const { data: rows } = await admin
    .from("mobilize_profile_posts")
    .select("id, author_id, content, content_html, image_urls, created_at")
    .in("id", postIds);
  if (!rows?.length) return [];

  const authorIds = rows.map((r) => r.author_id as string);
  const [authors, { data: reactions }, { data: comments }] = await Promise.all([
    resolveMobilizeAuthors(admin, authorIds),
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
    return {
      id: `pp-${id}`,
      kind: "profile_post" as const,
      created_at: row.created_at as string,
      author: authors.get(authorId)!,
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

async function loadBookmarkedGroupMessages(
  admin: SupabaseClient,
  viewerId: string,
  messageIds: string[]
): Promise<UnifiedFeedPost[]> {
  if (!messageIds.length) return [];
  const { data: rows } = await admin
    .from("mobilize_group_messages")
    .select("id, group_id, author_id, content, content_html, comments_policy, image_urls, created_at")
    .in("id", messageIds);
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
