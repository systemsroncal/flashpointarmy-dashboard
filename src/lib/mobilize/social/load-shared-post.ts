import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichGroupMessages } from "@/lib/mobilize/social/enrich-group-messages";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { summarizeReactions } from "@/lib/mobilize/social/reaction-summary";

export async function loadSharedGroupMessage(
  admin: SupabaseClient,
  viewerId: string,
  groupId: string,
  messageId: string
): Promise<UnifiedFeedPost | null> {
  const { data: row } = await admin
    .from("mobilize_group_messages")
    .select("id, group_id, author_id, content, content_html, comments_policy, image_urls, created_at")
    .eq("id", messageId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (!row) return null;

  const { data: group } = await admin.from("mobilize_groups").select("id, name").eq("id", groupId).maybeSingle();
  const enriched = await enrichGroupMessages(admin, viewerId, [row]);
  const m = enriched[0];
  if (!m) return null;

  return {
    id: `gm-${m.id}`,
    kind: "group_message",
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
    group: { id: m.group_id, name: (group?.name as string) ?? "Group" },
  };
}

export async function loadSharedProfilePost(
  admin: SupabaseClient,
  viewerId: string,
  profileUserId: string,
  postId: string
): Promise<UnifiedFeedPost | null> {
  const { data: row } = await admin
    .from("mobilize_profile_posts")
    .select("id, author_id, content, content_html, image_urls, created_at")
    .eq("id", postId)
    .eq("author_id", profileUserId)
    .maybeSingle();
  if (!row) return null;

  const authorId = row.author_id as string;
  const authors = await resolveMobilizeAuthors(admin, [authorId], { viewerId });
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    admin
      .from("mobilize_profile_post_reactions")
      .select("post_id, user_id, reaction_type")
      .eq("post_id", postId),
    admin.from("mobilize_profile_post_comments").select("post_id").eq("post_id", postId),
  ]);

  let viewerReaction: ReactionType | null = null;
  const reactionRows = (reactions ?? []).map((r) => {
    if (r.user_id === viewerId) viewerReaction = r.reaction_type as ReactionType;
    return { reaction_type: r.reaction_type as string };
  });

  return {
    id: `pp-${postId}`,
    kind: "profile_post",
    created_at: row.created_at as string,
    author: authors.get(authorId)!,
    content: row.content as string,
    content_html: (row.content_html as string | null) ?? null,
    image_urls: (row.image_urls as string[]) ?? [],
    reactions: summarizeReactions(reactionRows, viewerReaction),
    comment_count: comments?.length ?? 0,
    profile_user_id: profileUserId,
    post_id: postId,
  };
}