"use client";

import { MobilizeContentTabBar } from "@/components/mobilize/social/MobilizeContentTabBar";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { HOME_FEED_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import {
  TRUTH_HUB_BORDER,
  TRUTH_HUB_CENTER_BG,
  TRUTH_HUB_TEXT,
  TRUTH_HUB_TEXT_MUTED,
} from "@/lib/mobilize/social/social-hub-surface";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const HOME_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "groups", label: "Groups" },
] as const;

type HomeTabId = (typeof HOME_TABS)[number]["id"];

export function MobilizeOwnerHomeClient() {
  const me = useDashboardUser();
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("for_you");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerHtml, setComposerHtml] = useState("");
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedRes = await fetch(`/api/mobilize/social/home-feed?scope=${activeTab}`);
      const feedJson = await feedRes.json();
      if (!feedRes.ok) throw new Error(feedJson.error || "Failed to load feed.");
      setPosts((feedJson.posts ?? []) as UnifiedFeedPost[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load home.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publishPost() {
    const plain = composerHtml.replace(/<[^>]+>/g, "").trim();
    if (!plain && !composerImages.length) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${me.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: composerHtml, image_urls: composerImages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setComposerHtml("");
      setComposerImages([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed.");
    } finally {
      setPosting(false);
    }
  }

  const empty = HOME_FEED_EMPTY[activeTab];
  const canPost = Boolean(composerHtml.replace(/<[^>]+>/g, "").trim()) || composerImages.length > 0;

  return (
    <Box sx={{ ...mobilizeChapterDetailRootSx, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <MobilizeSocialHubLayout>
        <MobilizeSocialHubContent tone="truth-dark">
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 3,
              bgcolor: TRUTH_HUB_CENTER_BG,
              borderBottom: `1px solid ${TRUTH_HUB_BORDER}`,
              px: { xs: 1.5, sm: 2 },
              py: 1.35,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" fontWeight={800} sx={{ color: TRUTH_HUB_TEXT, fontSize: "1.15rem" }}>
              Home
            </Typography>
            <IconButton size="small" aria-label="Feed options" sx={{ color: TRUTH_HUB_TEXT_MUTED }}>
              <AutoAwesomeOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>

          {error ? (
            <Typography color="error" sx={{ px: 2, py: 1 }}>
              {error}
            </Typography>
          ) : null}

          <MobilizeSocialPostEditor
            value={composerHtml}
            onChange={setComposerHtml}
            disabled={posting}
            surface="dark"
            avatarUrl={me.avatar_url}
            avatarFallback={me.display_name ?? me.email ?? "?"}
            imageUrls={composerImages}
            onImageUrlsChange={setComposerImages}
            postLabel="Post"
            onPost={() => void publishPost()}
            posting={posting}
            canPost={canPost}
          />

          <MobilizeContentTabBar
            tabs={HOME_TABS.map((t) => ({ id: t.id, label: t.label }))}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as HomeTabId)}
            variant="truth"
            surface="dark"
          />

          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={28} sx={{ color: TRUTH_HUB_TEXT_MUTED }} />
              </Box>
            ) : (
              <StackFeed posts={posts} empty={empty} />
            )}
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>
    </Box>
  );
}

function StackFeed({
  posts,
  empty,
}: {
  posts: UnifiedFeedPost[];
  empty: { title: string; description: string };
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {!posts.length ? (
        <MobilizeSectionEmptyState
          fill
          surface="dark"
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
            surface="dark"
          />
        );
      })}
    </Box>
  );
}
