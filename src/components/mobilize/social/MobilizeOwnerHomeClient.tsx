"use client";

import { MobilizeContentTabBar } from "@/components/mobilize/social/MobilizeContentTabBar";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { HOME_FEED_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
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
      <MobilizeSocialHubLayout showRightRail={false}>
        <MobilizeSocialHubContent tone="light">
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: 960,
              mx: "auto",
              p: { xs: 0, sm: 1.5, md: 2 },
            }}
          >
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ mb: 1.5, color: "#0d0d0d", px: { xs: 1.5, sm: 0 }, pt: { xs: 1.5, sm: 0 } }}
            >
              Home
            </Typography>

            {error ? (
              <Typography color="error" sx={{ mb: 1, px: { xs: 1.5, sm: 0 } }}>
                {error}
              </Typography>
            ) : null}

            <Paper
              elevation={0}
              sx={{
                bgcolor: "#fff",
                color: "#0d0d0d",
                overflow: "hidden",
                p: 0,
                mt: { xs: 0, sm: "1rem" },
                borderRadius: { xs: 0, sm: "1rem" },
                boxShadow: { xs: "none", sm: "0 0 9px 1px #d2d2d2" },
                border: "none",
                borderBottom: { xs: "1px solid rgba(0,0,0,0.08)", sm: "none" },
              }}
            >
              <MobilizeSocialPostEditor
                value={composerHtml}
                onChange={setComposerHtml}
                disabled={posting}
                surface="light"
                brandAccent
                avatarUrl={me.avatar_url}
                avatarFallback={me.display_name ?? me.email ?? "?"}
                imageUrls={composerImages}
                onImageUrlsChange={setComposerImages}
                postLabel="Post"
                onPost={() => void publishPost()}
                posting={posting}
                canPost={canPost}
              />
            </Paper>

            <Box
              sx={{
                bgcolor: "#fff",
                borderRadius: { xs: 0, sm: 2 },
                borderTop: { xs: "none", sm: "1px solid rgba(0,0,0,0.08)" },
                overflow: "hidden",
                mb: { xs: 0, sm: 1.5 },
                mt: { xs: 0, sm: 1.5 },
              }}
            >
              <MobilizeContentTabBar
                tabs={HOME_TABS.map((t) => ({ id: t.id, label: t.label }))}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as HomeTabId)}
                variant="facebook"
                surface="light"
              />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <StackFeed
                  posts={posts}
                  empty={empty}
                  viewerAvatarUrl={me.avatar_url}
                  viewerDisplayName={me.display_name ?? me.email}
                  viewerUserId={me.id}
                  viewerIsSuperAdmin={me.role_names.includes("super_admin")}
                />
              )}
            </Box>
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>
    </Box>
  );
}

function StackFeed({
  posts,
  empty,
  viewerAvatarUrl,
  viewerDisplayName,
  viewerUserId,
  viewerIsSuperAdmin,
}: {
  posts: UnifiedFeedPost[];
  empty: { title: string; description: string };
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
  viewerUserId?: string;
  viewerIsSuperAdmin?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0, sm: 1.5 } }}>
      {!posts.length ? (
        <MobilizeSectionEmptyState
          fill
          layout="stacked"
          icon={<DynamicFeedOutlinedIcon sx={{ fontSize: "inherit", color: "rgba(0,0,0,0.35)" }} />}
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
            surface="light"
            layout="groupFeedCard"
            viewerAvatarUrl={viewerAvatarUrl}
            viewerDisplayName={viewerDisplayName}
            viewerUserId={viewerUserId}
            viewerIsSuperAdmin={viewerIsSuperAdmin}
          />
        );
      })}
    </Box>
  );
}
