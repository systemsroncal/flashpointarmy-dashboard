"use client";

import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import { MobilizeContentTabBar } from "@/components/mobilize/social/MobilizeContentTabBar";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MOBILIZE_EMPTY_STATE_IMAGES } from "@/lib/mobilize/mobilize-empty-state-icons";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const HOME_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "groups", label: "Groups" },
] as const;

type HomeTabId = (typeof HOME_TABS)[number]["id"];

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
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("for_you");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerHtml, setComposerHtml] = useState("");
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
    if (!plain) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${me.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: composerHtml }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setComposerHtml("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed.");
    } finally {
      setPosting(false);
    }
  }

  const empty = EMPTY_COPY[activeTab];

  return (
    <Box sx={{ ...mobilizeChapterDetailRootSx, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {error ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      ) : null}

      <MobilizeSocialHubLayout>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, color: "#0d0d0d", flex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Home
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2.5,
              border: "1px solid rgba(0,0,0,0.08)",
              bgcolor: "#fff",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              What&apos;s on your mind?
            </Typography>
            <GatheringDescriptionEditor
              value={composerHtml}
              onChange={setComposerHtml}
              label=""
              showHelper={false}
              compact
              disabled={posting}
            />
            <Button
              variant="contained"
              sx={{ mt: 1, borderRadius: 99, textTransform: "none", fontWeight: 700 }}
              disabled={posting || !composerHtml.replace(/<[^>]+>/g, "").trim()}
              onClick={() => void publishPost()}
            >
              {posting ? "Posting…" : "Post"}
            </Button>
          </Paper>

          <MobilizeContentTabBar
            tabs={HOME_TABS.map((t) => ({ id: t.id, label: t.label }))}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as HomeTabId)}
            variant="truth"
          />

          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <StackFeed posts={posts} empty={empty} />
            )}
          </Box>
        </Box>
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
    </Box>
  );
}
