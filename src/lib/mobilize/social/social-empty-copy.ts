export type SocialEmptyCopy = { title: string; description: string };

export const SOCIAL_EMPTY_DEFAULT_TITLE = "Nothing to see here yet";

export const HOME_FEED_EMPTY: Record<"for_you" | "following" | "groups", SocialEmptyCopy> = {
  for_you: {
    title: SOCIAL_EMPTY_DEFAULT_TITLE,
    description:
      "Follow members and join groups to see the latest posts from people and chapters in your feed.",
  },
  following: {
    title: "No posts from people you follow",
    description: "When you follow members, their profile posts will show up here.",
  },
  groups: {
    title: "No group posts yet",
    description: "Posts from groups you belong to will appear here. Join a group to get started.",
  },
};

export const ALERTS_EMPTY: SocialEmptyCopy = {
  title: "No alerts yet",
  description: "Likes, new followers, and reactions on your posts will show up here.",
};

export const MESSAGES_EMPTY: SocialEmptyCopy = {
  title: "No messages yet",
  description: "Messages appear here with members who follow you and whom you follow.",
};

export const BOOKMARKS_EMPTY: SocialEmptyCopy = {
  title: "No saved posts",
  description: "Save your favorite posts and they'll show up here.",
};

export const PROFILE_TAB_EMPTY: Record<"posts" | "replies" | "media" | "likes", SocialEmptyCopy> = {
  posts: {
    title: "No posts yet",
    description: "Posts you publish will appear here.",
  },
  replies: {
    title: "No replies yet",
    description: "Replies, comments, and shared posts will show up here.",
  },
  media: {
    title: "No media yet",
    description: "Photos and media from posts will appear in this gallery.",
  },
  likes: {
    title: "No liked posts yet",
    description: "Posts you have liked will appear here.",
  },
};

export const PRIVATE_PROFILE_TAB_MESSAGE =
  "This profile is private. Only the owner can view posts and activity.";
