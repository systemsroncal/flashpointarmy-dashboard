"use client";

import type { MobilizeSocialAuthor } from "@/components/mobilize/social/MobilizeSocialPostHeader";
import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import { TRUTH_HUB_BORDER, TRUTH_HUB_TEXT_MUTED } from "@/lib/mobilize/social/social-hub-surface";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link as MuiLink,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type SocialCommentNode = {
  id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  content: string;
  created_at: string;
  author: MobilizeSocialAuthor;
  reactions: {
    like: number;
    love: number;
    total: number;
    viewer_reaction: ReactionType | null;
  };
  replies: SocialCommentNode[];
};

type Props = {
  commentsUrl: string;
  commentReactionUrl: (commentId: string) => string;
  canComment: boolean;
  open: boolean;
  onCountChange?: (count: number) => void;
  tone?: "light" | "dark";
  viewerAvatarUrl?: string | null;
  viewerDisplayName?: string | null;
};

function countComments(nodes: SocialCommentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countComments(n.replies), 0);
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.floor(d / 7)}w`;
  return new Date(iso).toLocaleDateString();
}

function CommentItem({
  node,
  commentReactionUrl,
  canComment,
  onReply,
  depth,
  light,
}: {
  node: SocialCommentNode;
  commentReactionUrl: (commentId: string) => string;
  canComment: boolean;
  onReply: (parentId: string) => void;
  depth: number;
  light: boolean;
}) {
  const [reactions, setReactions] = useState(node.reactions);
  const [busy, setBusy] = useState(false);
  const profileHref = mobilizeMemberProfileHref(node.author.id);

  async function setReaction(next: ReactionType | null) {
    setBusy(true);
    try {
      const res = await fetch(commentReactionUrl(node.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reaction failed.");
      setReactions(json.reactions);
    } finally {
      setBusy(false);
    }
  }

  const liked = reactions.viewer_reaction === "like";
  const bubbleBg = light ? "#f0f2f5" : "rgba(255,255,255,0.08)";
  const nameMuted = light ? "#65676b" : "rgba(255,255,255,0.45)";
  const actionMuted = light ? "#65676b" : "rgba(255,255,255,0.55)";
  const likeBlue = "#0866ff";
  const avatarSize = depth > 0 ? 28 : 36;

  return (
    <Box sx={{ mt: depth > 0 ? 1 : 1.25, ml: depth > 0 ? 1 : 0 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <MuiLink component={Link} href={profileHref} underline="none" sx={{ flexShrink: 0, mt: 0.25 }}>
          <Avatar
            src={node.author.avatar_url ? publicAssetSrc(node.author.avatar_url) : undefined}
            sx={{ width: avatarSize, height: avatarSize, bgcolor: "#263238" }}
          >
            {node.author.display_name?.[0]}
          </Avatar>
        </MuiLink>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              bgcolor: bubbleBg,
              borderRadius: "18px",
              px: 1.5,
              py: 0.85,
              display: "inline-block",
              maxWidth: "100%",
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="baseline" flexWrap="wrap" useFlexGap>
              <MuiLink
                component={Link}
                href={profileHref}
                underline="hover"
                sx={{
                  fontWeight: 700,
                  fontSize: depth > 0 ? "0.75rem" : "0.8125rem",
                  lineHeight: 1.3,
                  color: light ? "#050505" : "#e7e9ea",
                }}
              >
                {node.author.display_name}
              </MuiLink>
              <Typography component="span" sx={{ fontSize: depth > 0 ? "0.7rem" : "0.75rem", color: nameMuted }}>
                {timeAgo(node.created_at)}
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: depth > 0 ? "0.875rem" : "0.9375rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                mt: 0.15,
                lineHeight: 1.35,
                color: light ? "#050505" : "#e7e9ea",
              }}
            >
              {node.content}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.35, ml: 0.5 }}>
            <IconButton
              size="small"
              disabled={busy}
              onClick={() => void setReaction(liked ? null : "like")}
              aria-label={liked ? "Unlike" : "Like"}
              sx={{ p: 0.35, color: liked ? likeBlue : actionMuted }}
            >
              {liked ? <ThumbUpAltIcon sx={{ fontSize: 16 }} /> : <ThumbUpOffAltIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            {reactions.like > 0 ? (
              <Typography variant="caption" sx={{ color: actionMuted, mr: 0.25, minWidth: 10 }}>
                {reactions.like}
              </Typography>
            ) : null}
            <IconButton size="small" disabled aria-label="Dislike" sx={{ p: 0.35, color: actionMuted, opacity: 0.65 }}>
              <ThumbDownOffAltIcon sx={{ fontSize: 16 }} />
            </IconButton>
            {canComment && node.depth < 3 ? (
              <Button
                size="small"
                onClick={() => onReply(node.id)}
                sx={{
                  minWidth: 0,
                  px: 0.75,
                  py: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: actionMuted,
                  "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                }}
              >
                Reply
              </Button>
            ) : null}
          </Stack>
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              commentReactionUrl={commentReactionUrl}
              canComment={canComment}
              onReply={onReply}
              depth={depth + 1}
              light={light}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function MobilizeSocialComments({
  commentsUrl,
  commentReactionUrl,
  canComment,
  open,
  onCountChange,
  tone = "light",
  viewerAvatarUrl,
  viewerDisplayName,
}: Props) {
  const light = tone === "light";
  const isDark = tone === "dark";
  const [comments, setComments] = useState<SocialCommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(commentsUrl);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load comments.");
      const list = (json.comments ?? []) as SocialCommentNode[];
      setComments(list);
      onCountChange?.(countComments(list));
    } catch {
      setComments([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [commentsUrl, onCountChange]);

  useEffect(() => {
    if (open) {
      setCommentsExpanded(false);
      void load();
    }
  }, [open, load]);

  async function submitComment() {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    try {
      const res = await fetch(commentsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: replyParentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Comment failed.");
      setDraft("");
      setReplyParentId(null);
      await load();
    } finally {
      setPosting(false);
    }
  }

  if (!open) return null;

  const asName = viewerDisplayName?.trim() || "you";
  const nameMuted = light ? "#65676b" : TRUTH_HUB_TEXT_MUTED;
  const composerBg = light ? "#f0f2f5" : "rgba(255,255,255,0.06)";
  const visibleComments =
    commentsExpanded || comments.length <= 1 ? comments : comments.slice(0, 1);
  const hiddenCount = Math.max(0, comments.length - 1);

  const body = (
    <Box
      sx={{
        mt: 1.25,
        pt: 1.25,
        borderTop: isDark ? `1px dashed ${TRUTH_HUB_BORDER}` : "1px solid rgba(0,0,0,0.08)",
        px: 0.25,
        overflow: "visible",
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} sx={isDark ? { color: TRUTH_HUB_TEXT_MUTED } : undefined} />
        </Box>
      ) : null}
      {!loading && !comments.length ? (
        <Typography variant="body2" sx={{ mb: 1, color: nameMuted }}>
          No comments yet. Start the conversation.
        </Typography>
      ) : null}
      {visibleComments.map((c) => (
        <CommentItem
          key={c.id}
          node={c}
          commentReactionUrl={commentReactionUrl}
          canComment={canComment}
          onReply={(id) => setReplyParentId(id)}
          depth={0}
          light={light}
        />
      ))}
      {!loading && hiddenCount > 0 ? (
        <Button
          size="small"
          onClick={() => setCommentsExpanded((v) => !v)}
          sx={{
            mt: 0.75,
            ml: 5.5,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: light ? "#0866ff" : "#6eb5ff",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          {commentsExpanded ? "Read less" : "Read more"}
        </Button>
      ) : null}
      {canComment ? (
        <Box sx={{ mt: 1.5, overflow: "visible" }}>
          {replyParentId ? (
            <Typography variant="caption" display="block" sx={{ mb: 0.5, ml: 5.5, color: nameMuted }}>
              Replying…{" "}
              <Button size="small" sx={{ minWidth: 0, p: 0, textTransform: "none" }} onClick={() => setReplyParentId(null)}>
                Cancel
              </Button>
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", overflow: "visible" }}>
            <Avatar
              src={viewerAvatarUrl ? publicAssetSrc(viewerAvatarUrl) : undefined}
              sx={{ width: 36, height: 36, mt: 0.5, bgcolor: "#263238", flexShrink: 0 }}
            >
              {asName[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0, overflow: "visible", py: 0.25 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                placeholder={`Comment as ${asName}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={posting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitComment();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: composerBg,
                    borderRadius: "20px",
                    fontSize: "0.9375rem",
                    overflow: "hidden",
                    "& fieldset": {
                      border: "1px solid transparent",
                      borderRadius: "20px",
                    },
                    "&:hover fieldset": {
                      borderColor: light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)",
                    },
                    "&.Mui-focused": {
                      bgcolor: light ? "#fff" : "rgba(255,255,255,0.08)",
                      boxShadow: "none",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#0866ff",
                      borderWidth: "2px",
                    },
                    "& .MuiInputBase-input": { px: 1.5, py: 1 },
                  },
                }}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75, px: 0.5 }}>
                <Typography variant="caption" sx={{ color: nameMuted }}>
                  You&apos;re commenting as {asName}.
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  disabled={posting || !draft.trim()}
                  onClick={() => void submitComment()}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 5,
                    bgcolor: light ? "#0866ff" : undefined,
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none", bgcolor: light ? "#0654d0" : undefined },
                  }}
                >
                  {posting ? "…" : "Post"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );

  if (isDark) {
    return (
      <ThemeProvider theme={mobilizePanelTheme}>
        <Box sx={{ color: "#0d0d0d" }}>{body}</Box>
      </ThemeProvider>
    );
  }

  return body;
}
