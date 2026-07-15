import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMobilizeAuthors } from "@/lib/mobilize/social/resolve-authors";
import { summarizeReactions, type ReactionType } from "@/lib/mobilize/social/reaction-summary";

export type EnrichedGroupMessage = {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  content_html: string | null;
  comments_policy: string;
  image_urls: string[];
  created_at: string;
  author: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
  };
  reactions: {
    like: number;
    love: number;
    total: number;
    viewer_reaction: ReactionType | null;
  };
  comment_count: number;
};

export async function enrichGroupMessages(
  admin: SupabaseClient,
  viewerId: string,
  rows: {
    id: string;
    group_id: string;
    author_id: string;
    content: string;
    content_html?: string | null;
    comments_policy?: string;
    image_urls?: string[] | null;
    created_at: string;
  }[]
): Promise<EnrichedGroupMessage[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const authorIds = rows.map((r) => r.author_id);

  const [authors, { data: reactions }, { data: comments }] = await Promise.all([
    resolveMobilizeAuthors(admin, authorIds),
    admin
      .from("mobilize_message_reactions")
      .select("message_id, user_id, reaction_type")
      .in("message_id", ids),
    admin
      .from("mobilize_message_comments")
      .select("message_id")
      .in("message_id", ids),
  ]);

  const reactionsByMessage = new Map<string, { reaction_type: string }[]>();
  const viewerReactionByMessage = new Map<string, ReactionType>();
  for (const r of reactions ?? []) {
    const mid = r.message_id as string;
    const list = reactionsByMessage.get(mid) ?? [];
    list.push({ reaction_type: r.reaction_type as string });
    reactionsByMessage.set(mid, list);
    if (r.user_id === viewerId) {
      viewerReactionByMessage.set(mid, r.reaction_type as ReactionType);
    }
  }

  const commentCountByMessage = new Map<string, number>();
  for (const c of comments ?? []) {
    const mid = c.message_id as string;
    commentCountByMessage.set(mid, (commentCountByMessage.get(mid) ?? 0) + 1);
  }

  return rows.map((row) => {
    const author = authors.get(row.author_id) ?? {
      id: row.author_id,
      display_name: "Member",
      handle: `@${row.author_id.slice(0, 8)}`,
      avatar_url: null,
    };
    const reactionRows = reactionsByMessage.get(row.id) ?? [];
    const viewerReaction = viewerReactionByMessage.get(row.id) ?? null;
    return {
      id: row.id,
      group_id: row.group_id,
      author_id: row.author_id,
      content: row.content,
      content_html: row.content_html ?? null,
      comments_policy: row.comments_policy ?? "everyone",
      image_urls: row.image_urls ?? [],
      created_at: row.created_at,
      author,
      reactions: summarizeReactions(reactionRows, viewerReaction),
      comment_count: commentCountByMessage.get(row.id) ?? 0,
    };
  });
}
