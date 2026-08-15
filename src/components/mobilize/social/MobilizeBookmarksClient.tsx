"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { BOOKMARKS_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { SOCIAL_HUB_LIGHT_BG } from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { Box, CircularProgress, ThemeProvider, Typography } from "@mui/material";
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
    // Same light chrome as My Groups: gray container, dark type, white cards.
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={{
          bgcolor: SOCIAL_HUB_LIGHT_BG,
          color: "text.primary",
          borderRadius: { xs: 0, sm: 2 },
          border: { xs: "none", sm: "1px solid rgba(0,0,0,0.06)" },
          p: { xs: 1.5, sm: 2, md: 2.5 },
          boxSizing: "border-box",
          width: "100%",
          flex: 1,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 685,
            mx: "auto",
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My saved
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Posts you bookmarked from your feed and groups.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !posts.length ? (
            <MobilizeSectionEmptyState
              fill
              layout="stacked"
              title={BOOKMARKS_EMPTY.title}
              description={BOOKMARKS_EMPTY.description}
            />
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
      </Box>
    </ThemeProvider>
  );
}
