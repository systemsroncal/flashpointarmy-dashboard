import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";

export function bookmarkRefFromPost(post: UnifiedFeedPost): {
  post_kind: "profile_post" | "group_message";
  post_ref_id: string;
} | null {
  if (post.kind === "profile_post" && post.post_id) {
    return { post_kind: "profile_post", post_ref_id: post.post_id };
  }
  if (post.kind === "group_message" && post.message_id) {
    return { post_kind: "group_message", post_ref_id: post.message_id };
  }
  return null;
}
