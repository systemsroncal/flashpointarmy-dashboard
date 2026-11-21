import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";

/** Dashboard URL for opening a single post (login required; pass as login redirect). */
export function buildMobilizePostSharePath(post: UnifiedFeedPost): string | null {
  if (post.kind === "group_message" && post.group_id && post.message_id) {
    const q = new URLSearchParams({
      kind: "group_message",
      group_id: post.group_id,
      post_id: post.message_id,
    });
    return `/dashboard/mobilize/post/share?${q.toString()}`;
  }
  if (post.kind === "profile_post" && post.profile_user_id && post.post_id) {
    const q = new URLSearchParams({
      kind: "profile_post",
      user_id: post.profile_user_id,
      post_id: post.post_id,
    });
    return `/dashboard/mobilize/post/share?${q.toString()}`;
  }
  return null;
}

export function absoluteMobilizePostShareUrl(origin: string, post: UnifiedFeedPost): string | null {
  const path = buildMobilizePostSharePath(post);
  if (!path) return null;
  return `${origin.replace(/\/$/, "")}${path}`;
}