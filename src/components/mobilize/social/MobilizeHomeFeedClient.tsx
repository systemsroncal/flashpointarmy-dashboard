"use client";

import { MobilizeSocialFeedShell } from "@/components/mobilize/social/MobilizeSocialFeedShell";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import type { RecommendedUser, UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Avatar, Box, Button, CircularProgress, Typography } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function RecommendedUserRow({
  user,
  onFollowChange,
}: {
  user: RecommendedUser;
  onFollowChange: (userId: string, following: boolean) => void;
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
      onFollowChange(user.id, Boolean(json.is_following));
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
          style={{ textDecoration: "none", color: "inherit", fontWeight: 700, fontSize: "0.9rem" }}
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

export function MobilizeHomeFeedClient() {
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [mode, setMode] = useState<"following" | "recommended">("following");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/social/home-feed");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load feed.");
      setPosts((json.posts ?? []) as UnifiedFeedPost[]);
      setRecommendations((json.recommendations ?? []) as RecommendedUser[]);
      setMode(json.mode === "recommended" ? "recommended" : "following");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rightRail =
    recommendations.length > 0 ? (
      <MobilizeRecommendationsCard title="People to follow">
        {recommendations.map((u) => (
          <RecommendedUserRow
            key={u.id}
            user={u}
            onFollowChange={() => void load()}
          />
        ))}
      </MobilizeRecommendationsCard>
    ) : null;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
        Home
      </Typography>
      {mode === "recommended" ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Follow members from your groups to personalize your feed. Showing recommended posts for now.
        </Typography>
      ) : null}
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <MobilizeSocialFeedShell rightRail={rightRail}>
          {!posts.length ? (
            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: 2.5,
                p: 3,
                textAlign: "center",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Typography color="text.secondary">
                No posts yet. Join a group or follow members to see updates here.
              </Typography>
            </Box>
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
  );
}
