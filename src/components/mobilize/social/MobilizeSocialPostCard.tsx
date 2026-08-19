"use client";

import { MobilizeAnnouncementMediaGrid } from "@/components/mobilize/MobilizeAnnouncementMediaGrid";
import { findAllVideoMarkers } from "@/components/dashboard/notifications/announcement-video-markers";
import { MobilizeCollapsiblePostBody } from "@/components/mobilize/social/MobilizeCollapsiblePostBody";
import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeSocialComments } from "@/components/mobilize/social/MobilizeSocialComments";
import { MobilizeSocialPostHeader } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import { MobilizeSocialReactionBar } from "@/components/mobilize/social/MobilizeSocialReactionBar";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { bookmarkRefFromPost } from "@/lib/mobilize/social/bookmark-ref";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import {
  TRUTH_HUB_BORDER,
  TRUTH_HUB_TEXT,
  TRUTH_HUB_TEXT_MUTED,
} from "@/lib/mobilize/social/social-hub-surface";
import { mobilizeGroupFeedPostCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PushPinIcon from "@mui/icons-material/PushPin";
import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";

type CommentConfig = {
  commentsUrl: string;
  commentReactionUrl: (commentId: string) => string;
};

type Props = {
  post: UnifiedFeedPost;
  canComment: boolean;
  commentConfig: CommentConfig;
  reactionUrl: string;
  showGroupBadge?: boolean;
  manageActions?: React.ReactNode;
  onReactionChange?: (reactions: UnifiedFeedPost["reactions"]) => void;
  surface?: "light" | "dark";
  /** Inline row inside a shared group feed card (divider between posts). */
  layout?: "card" | "groupFeedList" | "groupFeedCard";
  authorRoleLabel?: string;
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
  /** Viewer id — enables comment deletion for comment authors / super admins. */
  viewerUserId?: string;
  /** Viewer is a super admin — may delete any post/comment. */
  viewerIsSuperAdmin?: boolean;
  /** Shows the "Pinned Post" banner above the author row. */
  pinned?: boolean;
  /** Hides the reaction bar + comments (for Discover tab posts). */
  hideReactionBar?: boolean;
  /** Renders a "Join Group" button next to the group badge. */
  groupJoinButton?: React.ReactNode;
};

export function MobilizeSocialPostCard({
  post,
  canComment,
  commentConfig,
  reactionUrl,
  showGroupBadge = true,
  manageActions,
  onReactionChange,
  surface = "light",
  layout = "card",
  authorRoleLabel,
  viewerAvatarUrl,
  viewerDisplayName,
  viewerUserId,
  viewerIsSuperAdmin = false,
  pinned = false,
  hideReactionBar = false,
  groupJoinButton,
}: Props) {
  const isDark = surface === "dark";
  const isGroupFeedList = layout === "groupFeedList";
  const isGroupFeedCard = layout === "groupFeedCard";
  const [reactions, setReactions] = useState(post.reactions);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const bookmarkRef = bookmarkRefFromPost(post);
  const hasEmbeddedVideo = findAllVideoMarkers(post.content_html ?? "").length > 0;

  const feedBody = (
    <MobilizeFeedHtml
      html={post.content_html}
      plain={post.content}
      sx={isDark ? { color: TRUTH_HUB_TEXT, "& a": { color: "#6eb5ff" } } : undefined}
    />
  );
  const feedMedia = <MobilizeAnnouncementMediaGrid urls={post.image_urls ?? []} />;
  const hasRealImages = Boolean(
    post.image_urls?.filter((u) => typeof u === "string" && u.trim().length > 0).length
  );

  async function toggleBookmark() {
    if (!bookmarkRef) return;
    setBookmarkBusy(true);
    try {
      if (bookmarked) {
        const params = new URLSearchParams({
          post_kind: bookmarkRef.post_kind,
          post_ref_id: bookmarkRef.post_ref_id,
        });
        const res = await fetch(`/api/mobilize/social/bookmarks?${params}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setBookmarked(false);
      } else {
        const res = await fetch("/api/mobilize/social/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookmarkRef),
        });
        if (!res.ok) throw new Error();
        setBookmarked(true);
      }
    } finally {
      setBookmarkBusy(false);
    }
  }

  async function setReaction(next: ReactionType | null) {
    setReacting(true);
    try {
      const res = await fetch(reactionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
      onReactionChange?.(json.reactions);
    } finally {
      setReacting(false);
    }
  }

  return (
    <Card
      elevation={0}
      sx={{
        mb: isGroupFeedList || isGroupFeedCard ? 0 : isDark ? 0 : 1.5,
        borderRadius: isGroupFeedList || isGroupFeedCard ? 0 : isDark ? 0 : 2.5,
        border: isGroupFeedList || isGroupFeedCard ? "none" : isDark ? "none" : "1px solid rgba(0,0,0,0.08)",
        borderBottom: isGroupFeedList
          ? "1px solid rgba(0,0,0,0.08)"
          : isDark
            ? `1px solid ${TRUTH_HUB_BORDER}`
            : undefined,
        bgcolor: isGroupFeedList || isGroupFeedCard || isDark ? "transparent" : "#fff",
        boxShadow: isGroupFeedList || isGroupFeedCard || isDark ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
        color: isDark ? TRUTH_HUB_TEXT : undefined,
        overflow: "visible",
        "&:last-child": isGroupFeedList ? { borderBottom: "none" } : undefined,
      }}
    >
      <CardContent
        sx={
          isGroupFeedCard
            ? {
                ...mobilizeGroupFeedPostCardSx,
                p: { xs: 1.25, sm: 2 },
                borderRadius: { xs: 0, sm: "1rem" },
                boxShadow: { xs: "none", sm: "0 0 9px 1px #d2d2d2" },
                borderBottom: { xs: "1px solid rgba(0,0,0,0.08)", sm: "none" },
                "&:last-child": { pb: { xs: 1.25, sm: 2 }, mb: 0 },
              }
            : { p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }
        }
      >
        {pinned ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              mb: 1.25,
              pb: 1,
              borderBottom: isDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
              color: isDark ? TRUTH_HUB_TEXT_MUTED : "rgba(0,0,0,0.6)",
            }}
          >
            <PushPinIcon sx={{ fontSize: 18, transform: "rotate(45deg)" }} />
            <Typography variant="body2" fontWeight={700} sx={{ color: "inherit" }}>
              Pinned Post
            </Typography>
          </Stack>
        ) : null}
        <MobilizeSocialPostHeader
          author={post.author}
          createdAt={post.created_at}
          tone={surface}
          roleLabel={authorRoleLabel}
          viewerUserId={viewerUserId}
        />
        {showGroupBadge && post.group ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: isDark ? TRUTH_HUB_TEXT_MUTED : undefined }}>
              in{" "}
              <Link
                href={mobilizeGroupDetailHref(post.group.id, "announcements")}
                style={{
                  color: isDark ? "#6eb5ff" : "#1565c0",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {post.group.name}
              </Link>
            </Typography>
            {groupJoinButton ?? null}
          </Box>
        ) : null}
        {post.comments_policy === "leaders_only" ? (
          <Chip size="small" label="Leaders can comment" sx={{ mt: 0.75 }} variant="outlined" />
        ) : null}
        <Box sx={{ mt: isGroupFeedCard || isGroupFeedList ? 0 : 1.25 }}>
          {hasEmbeddedVideo ? (
            <Box>
              {feedBody}
              {feedMedia}
            </Box>
          ) : (
            <MobilizeCollapsiblePostBody surface={surface} text={feedBody} media={feedMedia} plain={post.content} hasImages={hasRealImages} />
          )}
        </Box>
        {!hideReactionBar ? (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
              sx={{
                mt: 1.25,
                pt: 1,
                borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <MobilizeSocialReactionBar
                  reactions={reactions}
                  commentCount={commentCount}
                  onToggleLike={() => void setReaction(reactions.viewer_reaction === "like" ? null : "like")}
                  onToggleLove={() => void setReaction(reactions.viewer_reaction === "love" ? null : "love")}
                  onToggleComments={() => setCommentsOpen((v) => !v)}
                  commentsOpen={commentsOpen}
                  disabled={reacting}
                  tone={surface}
                  embedded
                />
              </Box>
              <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0, ml: "auto" }}>
                {manageActions}
                {bookmarkRef ? (
                  <Tooltip title={bookmarked ? "Unsave" : "Save"}>
                    <IconButton
                      size="small"
                      onClick={() => void toggleBookmark()}
                      disabled={bookmarkBusy}
                      aria-label={bookmarked ? "Unsave post" : "Save post"}
                      sx={{ color: isDark ? TRUTH_HUB_TEXT_MUTED : undefined }}
                    >
                      {bookmarked ? (
                        <BookmarkIcon fontSize="small" color={isDark ? "inherit" : "primary"} />
                      ) : (
                        <BookmarkBorderOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Stack>
            <MobilizeSocialComments
              open={commentsOpen}
              canComment={canComment}
              commentsUrl={commentConfig.commentsUrl}
              commentReactionUrl={commentConfig.commentReactionUrl}
              onCountChange={setCommentCount}
              tone={surface}
              viewerAvatarUrl={viewerAvatarUrl}
              viewerDisplayName={viewerDisplayName}
              viewerUserId={viewerUserId}
              viewerIsSuperAdmin={viewerIsSuperAdmin}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
