"use client";

import { MobilizeContentTabBar } from "@/components/mobilize/social/MobilizeContentTabBar";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { DiscoverJoinGroupButton } from "@/components/mobilize/social/DiscoverJoinGroupButton";
import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import {
  canCommentOnUnifiedPost,
  feedPostCommentConfig,
  feedPostReactionUrl,
} from "@/lib/mobilize/social/feed-post-urls";
import { HOME_FEED_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import {
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MobilizeNoFollowersPostDialog } from "@/components/mobilize/social/MobilizeNoFollowersPostDialog";
import {
  PROFILE_POST_TARGET,
  type ComposerPostTarget,
} from "@/lib/mobilize/social/composer-post-target";
import { shouldShowNoFollowersPostNudge } from "@/lib/mobilize/social/composer-no-followers-nudge";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMobilizeScrollHide } from "@/lib/mobilize/social/use-mobilize-scroll-hide";

const HOME_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "groups", label: "Groups" },
  { id: "recommended", label: "Discover New Groups" },
] as const;

/** Home feed composer: keep code, hide UI until we re-enable out-of-group posting. */
const SHOW_HOME_COMPOSER = true;

type HomeTabId = (typeof HOME_TABS)[number]["id"];
// Ensure "recommended" is recognized as a valid scope for the API call.

function canManageHomePost(post: UnifiedFeedPost, viewerId: string, roleNames: string[]) {
  if (post.author.id === viewerId) return true;
  if (roleNames.includes("super_admin")) return true;
  return false;
}

export function MobilizeOwnerHomeClient() {
  const me = useDashboardUser();
  const router = useRouter();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const hideChromeOnScroll = useMobilizeScrollHide(mobile);
  const isSuperAdmin = me.role_names.includes("super_admin");
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("for_you");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerHtml, setComposerHtml] = useState("");
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<UnifiedFeedPost | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editPostTarget, setEditPostTarget] = useState<UnifiedFeedPost | null>(null);
  const [editPostHtml, setEditPostHtml] = useState("");
  const [editPostImages, setEditPostImages] = useState<string[]>([]);
  const [editPostSaving, setEditPostSaving] = useState(false);
  const [composerPostTarget, setComposerPostTarget] = useState<ComposerPostTarget>(PROFILE_POST_TARGET);
  const [myFollowersCount, setMyFollowersCount] = useState<number | null>(null);
  const [noFollowersNudge, setNoFollowersNudge] = useState<{
    html: string;
    meta?: { postTarget: ComposerPostTarget };
  } | null>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/social/profiles/${me.id}`);
        const json = (await res.json()) as { profile?: { followers_count?: number } };
        if (!cancelled && res.ok) {
          setMyFollowersCount(Number(json.profile?.followers_count ?? 0));
        }
      } catch {
        if (!cancelled) setMyFollowersCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me.id]);

  const load = useCallback(async (opts?: { silent?: boolean; append?: boolean }) => {
    if (!opts?.append) {
      offsetRef.current = 0;
    }
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const offset = opts?.append ? offsetRef.current : 0;
      const feedRes = await fetch(`/api/mobilize/social/home-feed?scope=${activeTab}&limit=${PAGE_SIZE}&offset=${offset}`);
      const feedJson = await feedRes.json();
      if (!feedRes.ok) throw new Error(feedJson.error || "Failed to load feed.");
      const newPosts = (feedJson.posts ?? []) as UnifiedFeedPost[];
      if (opts?.append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setHasMore(Boolean(feedJson.hasMore));
      offsetRef.current = offset + newPosts.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load home.");
      setPosts([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void load();
  }, [load]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          void load({ silent: true, append: true }).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, load]);

  async function executePublishPost(
    preparedHtml?: string,
    meta?: { postTarget: ComposerPostTarget }
  ): Promise<boolean> {
    const html = preparedHtml ?? composerHtml;
    const plain = html.replace(/<[^>]+>/g, "").trim();
    if (!plain && !composerImages.length) return false;
    const target = meta?.postTarget ?? composerPostTarget;
    setPosting(true);
    try {
      if (target.type === "group") {
        const res = await fetch(`/api/mobilize/groups/${target.groupId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content_html: html, image_urls: composerImages }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Post failed.");
        setComposerHtml("");
        setComposerImages([]);
        setComposerPostTarget(PROFILE_POST_TARGET);
        router.push(mobilizeGroupDetailHref(target.groupId, "announcements"));
        return true;
      }
      const res = await fetch(`/api/mobilize/social/profiles/${me.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_html: html, image_urls: composerImages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post failed.");
      setComposerHtml("");
      setComposerImages([]);
      await load({ silent: true });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed.");
      return false;
    } finally {
      setPosting(false);
    }
  }

  async function publishPost(
    preparedHtml?: string,
    meta?: { postTarget: ComposerPostTarget }
  ) {
    const target = meta?.postTarget ?? composerPostTarget;
    if (shouldShowNoFollowersPostNudge(myFollowersCount, target)) {
      const html = preparedHtml ?? composerHtml;
      setNoFollowersNudge({ html, meta });
      return;
    }
    await executePublishPost(preparedHtml, meta);
  }

  function openEditPost(post: UnifiedFeedPost) {
    setEditPostTarget(post);
    setEditPostHtml(post.content_html || post.content || "");
    setEditPostImages(post.image_urls ?? []);
  }

  async function saveEditPost(preparedHtml?: string) {
    if (!editPostTarget) return;
    const html = preparedHtml ?? editPostHtml;
    const plain = html.replace(/<[^>]+>/g, "").trim();
    if (!plain && !editPostImages.length) return;
    setEditPostSaving(true);
    try {
      let res: Response;
      if (editPostTarget.kind === "profile_post" && editPostTarget.profile_user_id && editPostTarget.post_id) {
        res = await fetch(
          `/api/mobilize/social/profiles/${editPostTarget.profile_user_id}/posts/${editPostTarget.post_id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content_html: html, image_urls: editPostImages }),
          }
        );
      } else if (
        editPostTarget.kind === "group_message" &&
        editPostTarget.group_id &&
        editPostTarget.message_id
      ) {
        res = await fetch(
          `/api/mobilize/groups/${editPostTarget.group_id}/messages/${editPostTarget.message_id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content_html: html, image_urls: editPostImages }),
          }
        );
      } else {
        throw new Error("Unsupported post type.");
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setEditPostTarget(null);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setEditPostSaving(false);
    }
  }

  async function confirmDeletePost() {
    if (!deletePostTarget) return;
    setDeletingPost(true);
    try {
      let res: Response;
      if (
        deletePostTarget.kind === "profile_post" &&
        deletePostTarget.profile_user_id &&
        deletePostTarget.post_id
      ) {
        res = await fetch(
          `/api/mobilize/social/profiles/${deletePostTarget.profile_user_id}/posts/${deletePostTarget.post_id}`,
          { method: "DELETE" }
        );
      } else if (
        deletePostTarget.kind === "group_message" &&
        deletePostTarget.group_id &&
        deletePostTarget.message_id
      ) {
        res = await fetch(
          `/api/mobilize/groups/${deletePostTarget.group_id}/messages/${deletePostTarget.message_id}`,
          { method: "DELETE" }
        );
      } else {
        throw new Error("Unsupported post type.");
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed.");
      setDeletePostTarget(null);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingPost(false);
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
              maxWidth: 685,
              mx: "auto",
              p: { xs: 0, sm: 1.5, md: 2 },
            }}
          >
            {error ? (
              <Typography color="error" sx={{ mb: 1, px: { xs: 1.5, sm: 0 } }}>
                {error}
              </Typography>
            ) : null}

            {SHOW_HOME_COMPOSER ? (
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
                  showVisibility
                  postTargetPicker
                  postTarget={composerPostTarget}
                  onPostTargetChange={setComposerPostTarget}
                  onPost={(html, meta) => void publishPost(html, meta)}
                  posting={posting}
                  canPost={canPost}
                />
              </Paper>
            ) : null}

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
                hiddenOnScroll={hideChromeOnScroll}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                bgcolor: "#fff",
                borderRadius: { xs: 0, sm: 2 },
                boxShadow: { xs: "none", sm: "0 0 9px 1px #d2d2d2" },
                borderBottom: { xs: "1px solid rgba(0,0,0,0.08)", sm: "none" },
                overflow: "hidden",
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#fff",
                    minHeight: { xs: "55vh", sm: 360 },
                    py: 6,
                  }}
                >
                  <CircularProgress size={28} sx={{ color: "rgba(0,0,0,0.35)" }} />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 0, sm: 1.5 },
                    p: { xs: 0, sm: 1.5 },
                    bgcolor: "#fff",
                  }}
                >
                  {!posts.length ? (
                    <MobilizeSectionEmptyState
                      fill
                      layout="stacked"
                      icon={
                        <DynamicFeedOutlinedIcon
                          sx={{ fontSize: "inherit", color: "rgba(0,0,0,0.35)" }}
                        />
                      }
                      title={empty.title}
                      description={empty.description}
                    />
                  ) : null}
                  {posts.map((post) => {
                    const reactionUrl = feedPostReactionUrl(post);
                    const commentConfig = feedPostCommentConfig(post);
                    if (!reactionUrl || !commentConfig.commentsUrl) return null;
                    const canManage = canManageHomePost(post, me.id, me.role_names);
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
                        hideReactionBar={activeTab === "recommended"}
                        groupJoinButton={activeTab === "recommended" && post.group ? <DiscoverJoinGroupButton groupId={post.group.id} /> : undefined}
                        viewerAvatarUrl={me.avatar_url}
                        viewerDisplayName={me.display_name ?? me.email}
                        viewerUserId={me.id}
                        viewerIsSuperAdmin={isSuperAdmin}
                        postManage={
                          canManage
                            ? {
                                onEdit: () => openEditPost(post),
                                onDelete: () => setDeletePostTarget(post),
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                  {/* Infinite scroll sentinel */}
                  {hasMore && posts.length > 0 ? (
                    <Box ref={sentinelRef} sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                      {loadingMore ? <CircularProgress size={22} /> : null}
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>

      <MobilizeDialog
        open={Boolean(deletePostTarget)}
        onClose={() => !deletingPost && setDeletePostTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This post will be permanently removed. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePostTarget(null)} disabled={deletingPost}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deletingPost}
            onClick={() => void confirmDeletePost()}
          >
            {deletingPost ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeDialog
        open={Boolean(editPostTarget)}
        onClose={() => !editPostSaving && setEditPostTarget(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit post</DialogTitle>
        <DialogContent>
          {editPostTarget ? (
            <Box
              sx={{
                mt: 1,
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "12px",
                overflow: "hidden",
                bgcolor: "#fff",
              }}
            >
              <MobilizeSocialPostEditor
                value={editPostHtml}
                onChange={setEditPostHtml}
                disabled={editPostSaving}
                surface="light"
                brandAccent
                headingLabel="Edit post"
                avatarUrl={me.avatar_url}
                avatarFallback={me.display_name ?? me.email ?? "?"}
                imageUrls={editPostImages}
                onImageUrlsChange={setEditPostImages}
                groupId={
                  editPostTarget.kind === "group_message" ? editPostTarget.group_id : undefined
                }
                postLabel="Save"
                onPost={(html) => void saveEditPost(html)}
                posting={editPostSaving}
                canPost={
                  Boolean(editPostHtml.replace(/<[^>]+>/g, "").trim()) || editPostImages.length > 0
                }
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPostTarget(null)} disabled={editPostSaving}>
            Cancel
          </Button>
        </DialogActions>
      </MobilizeDialog>

      <MobilizeNoFollowersPostDialog
        open={Boolean(noFollowersNudge)}
        posting={posting}
        onClose={() => !posting && setNoFollowersNudge(null)}
        onPostToProfileAnyway={() => {
          if (!noFollowersNudge || posting) return;
          const pending = noFollowersNudge;
          void (async () => {
            const ok = await executePublishPost(pending.html, { postTarget: PROFILE_POST_TARGET });
            if (ok) setNoFollowersNudge(null);
          })();
        }}
        onPostToGroup={(groupId, name) => {
          if (!noFollowersNudge || posting) return;
          const pending = noFollowersNudge;
          const target: ComposerPostTarget = { type: "group", groupId, name };
          setComposerPostTarget(target);
          void (async () => {
            const ok = await executePublishPost(pending.html, { postTarget: target });
            if (ok) setNoFollowersNudge(null);
          })();
        }}
      />
    </Box>
  );
}
