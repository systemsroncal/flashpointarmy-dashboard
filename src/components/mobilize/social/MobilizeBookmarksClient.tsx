"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { BOOKMARKS_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

export function MobilizeBookmarksClient() {
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/social/bookmarks");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load bookmarks.");
      setPosts(json.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box sx={mobilizeChapterDetailRootSx}>
      <MobilizeSocialHubLayout>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, color: "#0d0d0d", flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Bookmarks
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !posts.length ? (
            <MobilizeSectionEmptyState fill title={BOOKMARKS_EMPTY.title} description={BOOKMARKS_EMPTY.description} />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
            </Box>
          )}
        </Box>
      </MobilizeSocialHubLayout>
    </Box>
  );
}
