"use client";

import { MobilizeContentTabBar } from "@/components/mobilize/social/MobilizeContentTabBar";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { MobilizeSocialPostEditor } from "@/components/mobilize/social/MobilizeSocialPostEditor";
import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const HOME_TABS = [
  { id: "for_you", label: "For you" },
  { id: "following", label: "Following" },
  { id: "groups", label: "Groups" },
] as const;

/** Home feed composer: keep code, hide UI until we re-enable out-of-group posting. */
const SHOW_HOME_COMPOSER = false;

type HomeTabId = (typeof HOME_TABS)[number]["id"];

function canManageHomePost(post: UnifiedFeedPost, viewerId: string, roleNames: string[]) {
  if (post.author.id === viewerId) return true;
  if (roleNames.includes("super_admin")) return true;
  return false;
}

export function MobilizeOwnerHomeClient() {
  const me = useDashboardUser();
  const isSuperAdmin = me.role_names.includes("super_admin");
  const [posts, setPosts] = useState<UnifiedFeedPost[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTabId>("for_you");
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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
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
      if (!opts?.silent) setLoading(false);
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
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed.");
    } finally {
      setPosting(false);
    }
  }

  function openEditPost(post: UnifiedFeedPost) {
    setEditPostTarget(post);
    setEditPostHtml(post.content_html || post.content || "");
    setEditPostImages(post.image_urls ?? []);
  }

  async function saveEditPost() {
    if (!editPostTarget) return;
    const plain = editPostHtml.replace(/<[^>]+>/g, "").trim();
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
            body: JSON.stringify({ content_html: editPostHtml, image_urls: editPostImages }),
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
            body: JSON.stringify({ content_html: editPostHtml, image_urls: editPostImages }),
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
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ mb: 1.5, color: "#0d0d0d", px: { xs: 1.5, sm: 0 }, pt: { xs: 1.5, sm: 0 } }}
            >
              Recommended for you
            </Typography>

            {error ? (
              <Typography color="error" sx={{ mb: 1, px: { xs: 1.5, sm: 0 } }}>
                {error}
              </Typography>
            ) : null}

            {/* Composer hidden for now — publish from groups / member profile only. */}
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
                  onPost={() => void publishPost()}
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
              />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: "15px", sm: 1.5 } }}>
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
                        viewerAvatarUrl={me.avatar_url}
                        viewerDisplayName={me.display_name ?? me.email}
                        viewerUserId={me.id}
                        viewerIsSuperAdmin={isSuperAdmin}
                        manageActions={
                          canManage ? (
                            <Stack direction="row" spacing={0.25}>
                              <Tooltip title="Edit post">
                                <IconButton
                                  size="small"
                                  onClick={() => openEditPost(post)}
                                  aria-label="Edit post"
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete post">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setDeletePostTarget(post)}
                                  aria-label="Delete post"
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          ) : undefined
                        }
                      />
                    );
                  })}
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
                onPost={() => void saveEditPost()}
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
    </Box>
  );
}
