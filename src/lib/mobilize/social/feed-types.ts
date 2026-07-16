import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";

export type SocialReactionBlock = {
  like: number;
  love: number;
  total: number;
  viewer_reaction: ReactionType | null;
};

export type UnifiedFeedPost = {
  id: string;
  kind: "group_message" | "profile_post";
  created_at: string;
  author: MobilizeAuthorSummary;
  content: string;
  content_html: string | null;
  image_urls: string[];
  reactions: SocialReactionBlock;
  comment_count: number;
  comments_policy?: string;
  group?: { id: string; name: string };
  /** For group_message */
  group_id?: string;
  message_id?: string;
  /** For profile_post */
  profile_user_id?: string;
  post_id?: string;
};

export type RecommendedUser = MobilizeAuthorSummary & {
  followers_count: number;
  is_following: boolean;
};
