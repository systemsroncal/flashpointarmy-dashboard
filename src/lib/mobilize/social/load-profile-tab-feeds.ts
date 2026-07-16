import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichGroupMessages } from "@/lib/mobilize/social/enrich-group-messages";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

export async function loadProfileReplies(
  admin: SupabaseClient,
  viewerId: string,
  profileUserId: string,
  limit = 40
): Promise<UnifiedFeedPost[]> {
  const [{ data: profileComments }, { data: groupComments }] = await Promise.all([
    admin
      .from("mobilize_profile_post_comments")
      .select("id, post_id, content, created_at")
      .eq("author_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("mobilize_message_comments")
      .select("id, message_id, content, created_at")
      .eq("author_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const profilePostIds = [...new Set((profileComments ?? []).map((c) => c.post_id as string))];
  const messageIds = [...new Set((groupComments ?? []).map((c) => c.message_id as string))];

  const [profilePosts, groupMessages] = await Promise.all([
    loadProfilePostsById(admin, viewerId, profilePostIds),
    loadGroupMessagesById(admin, viewerId, messageIds),
  ]);

  const profileByPostId = new Map(profilePosts.map((p) => [p.post_id!, p]));
  const groupByMessageId = new Map(groupMessages.map((p) => [p.message_id!, p]));

  const merged: UnifiedFeedPost[] = [];
  for (const c of profileComments ?? []) {
    const parent = profileByPostId.get(c.post_id as string);
    if (!parent) continue;
    merged.push({
      ...parent,
      id: `reply-ppc-${c.id}`,
      content: c.content as string,
      content_html: null,
      created_at: c.created_at as string,
    });
  }
  for (const c of groupComments ?? []) {
    const parent = groupByMessageId.get(c.message_id as string);
    if (!parent) continue;
    merged.push({
      ...parent,
      id: `reply-gmc-${c.id}`,
      content: c.content as string,
      content_html: null,
      created_at: c.created_at as string,
    });
  }

  return merged
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function loadProfileLikes(
  admin: SupabaseClient,
  viewerId: string,
  profileUserId: string,
  limit = 40
): Promise<UnifiedFeedPost[]> {
  const [{ data: postReactions }, { data: messageReactions }] = await Promise.all([
    admin
      .from("mobilize_profile_post_reactions")
      .select("post_id, created_at")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("mobilize_message_reactions")
      .select("message_id, created_at")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const profilePostIds = (postReactions ?? []).map((r) => r.post_id as string);
  const messageIds = (messageReactions ?? []).map((r) => r.message_id as string);

  const [profilePosts, groupMessages] = await Promise.all([
    loadProfilePostsById(admin, viewerId, profilePostIds),
    loadGroupMessagesById(admin, viewerId, messageIds),
  ]);

  const byKey = new Map<string, UnifiedFeedPost>();
  for (const p of [...profilePosts, ...groupMessages]) byKey.set(p.id, p);

  const ordered: UnifiedFeedPost[] = [];
  const marks = [
    ...(postReactions ?? []).map((r) => ({
      key: `pp-${r.post_id}`,
      at: r.created_at as string,
    })),
    ...(messageReactions ?? []).map((r) => ({
      key: `gm-${r.message_id}`,
      at: r.created_at as string,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  for (const m of marks) {
    const post = byKey.get(m.key);
    if (post) ordered.push(post);
  }
  return ordered.slice(0, limit);
}

async function loadProfilePostsById(
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
  const authors = await resolveMobilizeAuthors(admin, authorIds);
  const { data: reactions } = await admin
    .from("mobilize_profile_post_reactions")
    .select("post_id, user_id, reaction_type")
    .in("post_id", postIds);

  const reactionsByPost = new Map<string, { reaction_type: string }[]>();
  const viewerByPost = new Map<string, ReactionType>();
  for (const r of reactions ?? []) {
    const pid = r.post_id as string;
    const list = reactionsByPost.get(pid) ?? [];
    list.push({ reaction_type: r.reaction_type as string });
    reactionsByPost.set(pid, list);
    if (r.user_id === viewerId) viewerByPost.set(pid, r.reaction_type as ReactionType);
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
      comment_count: 0,
      profile_user_id: authorId,
      post_id: id,
    };
  });
}

async function loadGroupMessagesById(
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
