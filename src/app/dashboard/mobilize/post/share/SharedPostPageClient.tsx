"use client";

import { MobilizeSocialPostCard } from "@/components/mobilize/social/MobilizeSocialPostCard";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import { Box, Button, CircularProgress, Dialog, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Props = {
  viewerUserId: string;
  viewerDisplayName: string | null;
  viewerAvatarUrl: string | null;
};

export function SharedPostPageClient({ viewerUserId, viewerDisplayName, viewerAvatarUrl }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<UnifiedFeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mobilize/social/shared-post?${qs}`);
      if (res.status === 401) {
        const redirect = encodeURIComponent(`/dashboard/mobilize/post/share?${qs}`);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load post.");
      setPost(json.post as UnifiedFeedPost);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load post.");
    } finally {
      setLoading(false);
    }
  }, [qs, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const feedHref =
    post?.kind === "group_message" && post.group_id
      ? mobilizeGroupDetailHref(post.group_id, "announcements")
      : post?.kind === "profile_post" && post.profile_user_id
        ? `/dashboard/mobilize/members/${post.profile_user_id}`
        : "/dashboard/mobilize/home";

  return (
    <Dialog open fullScreen PaperProps={{ sx: { bgcolor: "#f0f2f5" } }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}>
        <Typography variant="subtitle1" fontWeight={800}>
          Shared post
        </Typography>
        <Button component={Link} href={feedHref} size="small" sx={{ mt: 0.5, textTransform: "none" }}>
          Open in feed
        </Button>
      </Box>
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 720, mx: "auto", width: "100%" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : null}
        {error ? (
          <Typography color="error" sx={{ py: 4 }}>
            {error}
          </Typography>
        ) : null}
        {post ? (
          <MobilizeSocialPostCard
            post={post}
            canComment
            commentConfig={
              post.kind === "group_message" && post.group_id && post.message_id
                ? {
                    commentsUrl: `/api/mobilize/groups/${post.group_id}/messages/${post.message_id}/comments`,
                    commentReactionUrl: (commentId) =>
                      `/api/mobilize/groups/${post.group_id}/messages/${post.message_id}/comments/${commentId}/reactions`,
                  }
                : {
                    commentsUrl: `/api/mobilize/social/profiles/${post.profile_user_id}/posts/${post.post_id}/comments`,
                    commentReactionUrl: (commentId) =>
                      `/api/mobilize/social/profiles/${post.profile_user_id}/posts/${post.post_id}/comments/${commentId}/reactions`,
                  }
            }
            reactionUrl={
              post.kind === "group_message" && post.group_id && post.message_id
                ? `/api/mobilize/groups/${post.group_id}/messages/${post.message_id}/reactions`
                : `/api/mobilize/social/profiles/${post.profile_user_id}/posts/${post.post_id}/reactions`
            }
            viewerUserId={viewerUserId}
            viewerDisplayName={viewerDisplayName}
            viewerAvatarUrl={viewerAvatarUrl}
            showGroupBadge={post.kind === "group_message"}
          />
        ) : null}
      </Box>
    </Dialog>
  );
}