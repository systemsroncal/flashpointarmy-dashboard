"use client";

import type { ReactionType } from "@/lib/mobilize/social/reaction-summary";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { Box, IconButton, Typography } from "@mui/material";

type ReactionCounts = {
  like: number;
  love: number;
  total: number;
  viewer_reaction: ReactionType | null;
};

type Props = {
  reactions: ReactionCounts;
  commentCount: number;
  onToggleLike: () => void;
  onToggleLove: () => void;
  onToggleComments?: () => void;
  commentsOpen?: boolean;
  disabled?: boolean;
  tone?: "light" | "dark";
};

export function MobilizeSocialReactionBar({
  reactions,
  commentCount,
  onToggleLike,
  onToggleLove,
  onToggleComments,
  commentsOpen,
  disabled,
  tone = "light",
}: Props) {
  const isDark = tone === "dark";
  const muted = isDark ? "#8b98a5" : "text.secondary";
  const accent = isDark ? "#6eb5ff" : "#1877f2";
  const liked = reactions.viewer_reaction === "like";
  const loved = reactions.viewer_reaction === "love";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        mt: 1.25,
        pt: 1,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onToggleLike}
        aria-label="Like"
        sx={{ color: liked ? accent : muted }}
      >
        {liked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />}
      </IconButton>
      {reactions.like > 0 ? (
        <Typography variant="caption" sx={{ color: muted, mr: 1 }}>
          {reactions.like}
        </Typography>
      ) : null}

      <IconButton
        size="small"
        disabled={disabled}
        onClick={onToggleLove}
        aria-label="Love"
        sx={{ color: loved ? "#ff6b9d" : muted }}
      >
        {loved ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
      </IconButton>
      {reactions.love > 0 ? (
        <Typography variant="caption" sx={{ color: muted, mr: 1 }}>
          {reactions.love}
        </Typography>
      ) : null}

      <IconButton
        size="small"
        disabled={disabled}
        onClick={onToggleComments}
        aria-label="Comments"
        aria-expanded={commentsOpen}
        sx={{ color: commentsOpen ? accent : muted, ml: 0.5 }}
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </IconButton>
      {commentCount > 0 ? (
        <Typography variant="caption" sx={{ color: muted }}>
          {commentCount}
        </Typography>
      ) : null}
    </Box>
  );
}
