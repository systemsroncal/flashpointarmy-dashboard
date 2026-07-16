"use client";

import { MobilizeProfilePageShell } from "@/components/mobilize/social/MobilizeProfilePageShell";
import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { RecommendedUser, UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { Avatar, Box, Button, CircularProgress, Typography } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PROFILE_COVER =
  "https://fparmychapters.com/wp-content/uploads/2026/07/image-cover-profile-right-scaled.jpg";

const HOME_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "groups", label: "Groups" },
] as const;

type HomeTabId = (typeof HOME_TABS)[number]["id"];

type ProfilePayload = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  city: string | null;
  state: string | null;
  joined_at: string;
};

function formatJoinedDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatHandle(handle: string) {
  const trimmed = handle.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function RecommendedUserRow({
  user,
  onFollowChange,
}: {
  user: RecommendedUser;
  onFollowChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(user.is_following);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${user.id}/follow`, {
        method: following ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Follow failed.");
      setFollowing(Boolean(json.is_following));
      onFollowChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1.25 }}>
      <Link href={mobilizeMemberProfileHref(user.id)} style={{ flexShrink: 0 }}>
        <Avatar
          src={user.avatar_url ? publicAssetSrc(user.avatar_url) : undefined}
          sx={{ width: 40, height: 40 }}
        >
          {user.display_name.charAt(0)}
        </Avatar>
      </Link>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link
          href={mobilizeMemberProfileHref(user.id)}
          style={{ textDecoration: "none", color: "#111", fontWeight: 700, fontSize: "0.9rem" }}
        >
          {user.display_name}
        </Link>
        <Typography variant="caption" color="text.secondary" display="block">
          {user.handle}
        </Typography>
      </Box>
      <Button
        size="small"
        variant={following ? "outlined" : "contained"}
        disabled={busy}
        onClick={() => void toggle()}
        sx={{ textTransform: "none", borderRadius: 99, minWidth: 88 }}
      >
        {following ? "Following" : "Follow"}
      </Button>
    </Box>
  );
}

const EMPTY_COPY: Record<HomeTabId, { title: string; description: string }> = {
  for_you: {
    title: "Nothing in your feed yet",
    description: "Join groups and follow members to see posts from people and chapters here.",
  },
  following: {
    title: "No posts from people you follow",
    description: "When you follow members, their profile posts will show up in this feed.",
  },
  groups: {
    title: "No group posts yet",
    description: "Posts from groups you belong to will appear here.",
  },
};

export function MobilizeOwnerHomeClient() {
  const me = useDashboardUser();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("for_you");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, feedRes] = await Promise.all([
        fetch(`/api/mobilize/social/profiles/${me.id}`),
        fetch(`/api/mobilize/social/home-feed?scope=${activeTab}`),
      ]);
      const profileJson = await profileRes.json();
      const feedJson = await feedRes.json();
      if (!profileRes.ok) throw new Error(profileJson.error || "Profile unavailable.");
      if (!feedRes.ok) throw new Error(feedJson.error || "Failed to load feed.");
      setProfile(profileJson.profile as ProfilePayload);
      setPosts((feedJson.posts ?? []) as UnifiedFeedPost[]);
      setRecommendations((feedJson.recommendations ?? []) as RecommendedUser[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load home.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, me.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={mobilizeChapterDetailRootSx}>
        <Typography color="error">{error ?? "Profile unavailable."}</Typography>
      </Box>
    );
  }

  const handleLabel = formatHandle(profile.handle);
  const locationLabel = [profile.city, profile.state].filter(Boolean).join(", ");
  const profileMeta = [
    `${profile.followers_count.toLocaleString()} Followers`,
    `${profile.following_count.toLocaleString()} Following`,
    `Joined ${formatJoinedDate(profile.joined_at)}`,
    locationLabel || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const rightRail =
    recommendations.length > 0 ? (
      <MobilizeRecommendationsCard title="People to follow">
        {recommendations.map((u) => (
          <RecommendedUserRow key={u.id} user={u} onFollowChange={() => void load()} />
        ))}
      </MobilizeRecommendationsCard>
    ) : null;

  const empty = EMPTY_COPY[activeTab];

  return (
    <Box sx={mobilizeChapterDetailRootSx}>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      <MobilizeProfilePageShell
        coverSrc={PROFILE_COVER}
        title={profile.display_name}
        subtitle={handleLabel}
        meta={profileMeta}
        avatarSrc={profile.avatar_url}
        avatarFallback={profile.display_name}
        tabs={HOME_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as HomeTabId)}
        socialTabStyle
        fillContent
        unifiedContent
        headerActions={
          <Button
            component={Link}
            href={mobilizeMemberProfileHref(me.id)}
            variant="outlined"
            sx={{
              borderRadius: 99,
              textTransform: "none",
              fontWeight: 700,
              color: "text.primary",
              borderColor: "rgba(0,0,0,0.2)",
            }}
          >
            View profile
          </Button>
        }
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            bgcolor: "#f0f2f5",
            p: { xs: 1.5, sm: 2 },
            overflow: "auto",
            color: "#0d0d0d",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <MobilizeSocialFeedShell rightRail={rightRail} fill>
              {!posts.length ? (
                <MobilizeSectionEmptyState
                  fill
                  imageSrc={MOBILIZE_EMPTY_STATE_IMAGES.announcements}
                  title={empty.title}
                  description={empty.description}
                />
              ) : null}
              {posts.map((post) => {
                const reactionUrl = feedPostReactionUrl(post);
                const commentConfig = feedPostCommentConfig(post);
                if (!reactionUrl || !commentConfig.commentsUrl) return null;
                return (
                  <MobilizeSocialPostCard
                    key={post.id}
                    post={post}
                    canComment={canCommentOnUnifiedPost(post, { isApproved: true })}
                    commentConfig={commentConfig}
                    reactionUrl={reactionUrl}
                    showGroupBadge
                  />
                );
              })}
            </MobilizeSocialFeedShell>
          )}
        </Box>
      </MobilizeProfilePageShell>
    </Box>
  );
}
