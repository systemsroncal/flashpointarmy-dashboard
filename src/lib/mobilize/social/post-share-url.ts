import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";

/** Opens the post in a popup on the group feed or profile feed (not a standalone page). */
export function buildMobilizePostSharePath(post: UnifiedFeedPost): string | null {
  if (post.kind === "group_message" && post.group_id && post.message_id) {
    return `${mobilizeGroupDetailHref(post.group_id, "announcements")}&share_post=${encodeURIComponent(post.message_id)}`;
  }
  if (post.kind === "profile_post" && post.profile_user_id && post.post_id) {
    const q = new URLSearchParams({ share_post: post.post_id });
    return `/dashboard/mobilize/profile/${post.profile_user_id}?${q.toString()}`;
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
    return `${mobilizeGroupDetailHref(params.group_id, "announcements")}&share_post=${encodeURIComponent(postId)}`;
  }
  if (kind === "profile_post" && params.user_id) {
    const q = new URLSearchParams({ share_post: postId });
    return `/dashboard/mobilize/profile/${params.user_id}?${q.toString()}`;
  }
  return null;
}