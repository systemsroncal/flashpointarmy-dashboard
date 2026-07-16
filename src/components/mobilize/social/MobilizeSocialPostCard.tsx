"use client";

import { MobilizeAnnouncementMediaGrid } from "@/components/mobilize/MobilizeAnnouncementMediaGrid";
import { MobilizeFeedHtml } from "@/components/mobilize/social/MobilizeFeedHtml";
import { MobilizeSocialComments } from "@/components/mobilize/social/MobilizeSocialComments";
import { MobilizeSocialPostHeader } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import { MobilizeSocialReactionBar } from "@/components/mobilize/social/MobilizeSocialReactionBar";
import type { UnifiedFeedPost } from "@/lib/mobilize/social/feed-types";
import { mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
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
};

export function MobilizeSocialPostCard({
  post,
  canComment,
  commentConfig,
  reactionUrl,
  showGroupBadge = true,
  manageActions,
  onReactionChange,
}: Props) {
  const [reactions, setReactions] = useState(post.reactions);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reacting, setReacting] = useState(false);

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
        mb: 1.5,
        borderRadius: 2.5,
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MobilizeSocialPostHeader author={post.author} createdAt={post.created_at} />
            {showGroupBadge && post.group ? (
              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                in{" "}
                <Link
                  href={mobilizeGroupDetailHref(post.group.id, "announcements")}
                  style={{ color: "#1565c0", textDecoration: "none", fontWeight: 600 }}
                >
                  {post.group.name}
                </Link>
              </Typography>
            ) : null}
            {post.comments_policy === "leaders_only" ? (
              <Chip size="small" label="Leaders can comment" sx={{ mt: 0.75 }} variant="outlined" />
            ) : null}
            <Box sx={{ mt: 1.25 }}>
              <MobilizeFeedHtml html={post.content_html} plain={post.content} />
            </Box>
            <MobilizeAnnouncementMediaGrid urls={post.image_urls ?? []} />
            <MobilizeSocialReactionBar
              reactions={reactions}
              commentCount={commentCount}
              onToggleLike={() => void setReaction(reactions.viewer_reaction === "like" ? null : "like")}
              onToggleLove={() => void setReaction(reactions.viewer_reaction === "love" ? null : "love")}
              onToggleComments={() => setCommentsOpen((v) => !v)}
              commentsOpen={commentsOpen}
              disabled={reacting}
            />
            <MobilizeSocialComments
              open={commentsOpen}
              canComment={canComment}
              commentsUrl={commentConfig.commentsUrl}
              commentReactionUrl={commentConfig.commentReactionUrl}
              onCountChange={setCommentCount}
            />
          </Box>
          {manageActions ? <Box flexShrink={0}>{manageActions}</Box> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
