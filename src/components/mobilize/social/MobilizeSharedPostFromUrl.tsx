"use client";

import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import { canCommentOnUnifiedPost, feedPostCommentConfig, feedPostReactionUrl } from "@/lib/mobilize/social/feed-post-urls";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { Dialog, DialogContent, CircularProgress, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  groupId?: string;
  profileUserId?: string;
  viewerUserId: string;
  viewerDisplayName: string | null;
  viewerAvatarUrl: string | null;
  viewerRoleNames: string[];
  isApprovedGroupMember?: boolean;
  isGroupLeader?: boolean;
};

export function MobilizeSharedPostFromUrl({
  groupId,
  profileUserId,
  viewerUserId,
  viewerDisplayName,
  viewerAvatarUrl,
  viewerRoleNames,
  isApprovedGroupMember = false,
  isGroupLeader = false,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sharePostId = searchParams.get("share_post")?.trim() || null;

  const [post, setPost] = useState<UnifiedFeedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const clearShareQuery = useCallback(() => {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("share_post");
    const next = q.toString() ? `${pathname}?${q}` : pathname;
    router.replace(next, { scroll: false });
  }, [pathname, router, searchParams]);

  const close = useCallback(() => {
    setDialogOpen(false);
    clearShareQuery();
  }, [clearShareQuery]);

  useEffect(() => {
    if (sharePostId) setDialogOpen(true);
    else setDialogOpen(false);
  }, [sharePostId]);

  useEffect(() => {
    if (!sharePostId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (groupId) {
      params.set("kind", "group_message");
      params.set("group_id", groupId);
      params.set("post_id", sharePostId);
    } else if (profileUserId) {
      params.set("kind", "profile_post");
      params.set("user_id", profileUserId);
      params.set("post_id", sharePostId);
    }

    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/social/shared-post?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Post not found.");
        if (!cancelled) setPost(json.post as UnifiedFeedPost);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Post not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sharePostId, groupId, profileUserId]);

  if (!sharePostId && !dialogOpen) return null;

  const dialogScrollSx = {
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(0,0,0,0.28) rgba(0,0,0,0.04)",
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(0,0,0,0.22)",
      borderRadius: 8,
    },
    "&::-webkit-scrollbar-track": { backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 8 },
  };

  const canComment = post
    ? canCommentOnUnifiedPost(post, {
        isApproved: profileUserId ? true : isApprovedGroupMember,
        isLeader: isGroupLeader,
        isSuperAdmin: viewerRoleNames.includes("super_admin"),
      })
    : false;

  return (
    <Dialog
      open={dialogOpen}
      onClose={close}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      TransitionProps={{
        onExited: () => {
          setPost(null);
          setError(null);
          setLoading(false);
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: "#f0f2f5",
          maxHeight: "min(92vh, 900px)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 1.25, sm: 2 },
          overflowY: "auto",
          ...dialogScrollSx,
        }}
      >
        {loading ? (
          <CircularProgress size={28} sx={{ display: "block", mx: "auto", my: 3 }} />
        ) : null}
        {error ? (
          <Typography color="error" sx={{ py: 2 }}>
            {error}
          </Typography>
        ) : null}
        {post && !loading ? (
          <MobilizeSocialPostCard
            post={post}
            canComment={canComment}
            commentConfig={feedPostCommentConfig(post)}
            reactionUrl={feedPostReactionUrl(post)}
            viewerUserId={viewerUserId}
            viewerDisplayName={viewerDisplayName}
            viewerAvatarUrl={viewerAvatarUrl}
            viewerIsSuperAdmin={viewerRoleNames.includes("super_admin")}
            showGroupBadge={post.kind === "group_message"}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}