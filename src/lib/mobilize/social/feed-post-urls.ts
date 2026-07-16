import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";

export function feedPostReactionUrl(post: UnifiedFeedPost): string {
  if (post.kind === "group_message" && post.group_id && post.message_id) {
    return `/api/mobilize/groups/${post.group_id}/messages/${post.message_id}/reactions`;
  }
  if (post.kind === "profile_post" && post.profile_user_id && post.post_id) {
    return `/api/mobilize/social/profiles/${post.profile_user_id}/posts/${post.post_id}/reactions`;
  }
  return "";
}

export function feedPostCommentConfig(post: UnifiedFeedPost): {
  commentsUrl: string;
  commentReactionUrl: (commentId: string) => string;
} {
  if (post.kind === "group_message" && post.group_id && post.message_id) {
    const base = `/api/mobilize/groups/${post.group_id}/messages/${post.message_id}/comments`;
    return {
      commentsUrl: base,
      commentReactionUrl: (commentId) => `${base}/${commentId}/reactions`,
    };
  }
  if (post.kind === "profile_post" && post.profile_user_id && post.post_id) {
    const base = `/api/mobilize/social/profiles/${post.profile_user_id}/posts/${post.post_id}/comments`;
    return {
      commentsUrl: base,
      commentReactionUrl: (commentId) => `${base}/${commentId}/reactions`,
    };
  }
  return { commentsUrl: "", commentReactionUrl: () => "" };
}

export function canCommentOnUnifiedPost(
  post: UnifiedFeedPost,
  opts: { isApproved?: boolean; isLeader?: boolean; isSuperAdmin?: boolean }
): boolean {
  if (post.kind === "profile_post") return true;
  if (!opts.isApproved) return false;
  if (post.comments_policy !== "leaders_only") return true;
  return Boolean(opts.isLeader || opts.isSuperAdmin);
}
