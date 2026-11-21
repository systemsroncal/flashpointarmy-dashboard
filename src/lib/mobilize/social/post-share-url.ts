import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";

export function mobilizeGroupFeedShareHref(groupId: string, messageId: string): string {
  const q = new URLSearchParams({
    tab: "announcements",
    share_post: messageId,
  });
  return `/dashboard/mobilize/groups/${groupId}?${q.toString()}`;
}

export function mobilizeProfileFeedShareHref(profileUserId: string, postId: string): string {
  const q = new URLSearchParams({ share_post: postId });
  return `/dashboard/mobilize/profile/${profileUserId}?${q.toString()}`;
}

/** Opens the post in a popup on the group feed or profile feed (not a standalone page). */
export function buildMobilizePostSharePath(post: UnifiedFeedPost): string | null {
  if (post.kind === "group_message" && post.group_id && post.message_id) {
    return mobilizeGroupFeedShareHref(post.group_id, post.message_id);
  }
  if (post.kind === "profile_post" && post.profile_user_id && post.post_id) {
    return mobilizeProfileFeedShareHref(post.profile_user_id, post.post_id);
  }
  return null;
}

export function absoluteMobilizePostShareUrl(origin: string, post: UnifiedFeedPost): string | null {
  const path = buildMobilizePostSharePath(post);
  if (!path) return null;
  return `${origin.replace(/\/$/, "")}${path}`;
}

/** Legacy `/dashboard/mobilize/post/share` → feed URL with popup query. */
export function legacySharePageRedirectPath(
  params: Record<string, string | undefined>
): string | null {
  const kind = params.kind;
  const postId = params.post_id?.trim();
  if (!postId) return null;
  if (kind === "group_message" && params.group_id) {
    return mobilizeGroupFeedShareHref(params.group_id, postId);
  }
  if (kind === "profile_post" && params.user_id) {
    return mobilizeProfileFeedShareHref(params.user_id, postId);
  }
  return null;
}