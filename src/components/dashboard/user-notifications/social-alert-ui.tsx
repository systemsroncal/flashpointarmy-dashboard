"use client";

import type { SocialAlert, SocialAlertKind } from "@/lib/mobilize/social/load-social-alerts";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import { Avatar, Box } from "@mui/material";
import type { ReactNode } from "react";

const KIND_BADGE: Record<SocialAlertKind, { icon: ReactNode; bg: string }> = {
  follow: { icon: <PersonAddAlt1Icon sx={{ fontSize: 12 }} />, bg: "#1877f2" },
  like_profile_post: { icon: <FavoriteIcon sx={{ fontSize: 12 }} />, bg: "#e0245e" },
  like_group_post: { icon: <FavoriteIcon sx={{ fontSize: 12 }} />, bg: "#e0245e" },
  comment_profile_post: { icon: <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 12 }} />, bg: "#00ba7c" },
  comment_group_post: { icon: <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 12 }} />, bg: "#00ba7c" },
  followed_profile_post: { icon: <PostAddOutlinedIcon sx={{ fontSize: 12 }} />, bg: "#6b7280" },
  followed_group_post: { icon: <PostAddOutlinedIcon sx={{ fontSize: 12 }} />, bg: "#6b7280" },
};

/** Short "3m / 5h / 2d" label, with the full date in a title attribute upstream. */
export function formatAlertTime(iso: string): string {
  const date = new Date(iso);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (!Number.isFinite(mins)) return "";
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Actor avatar with a small colored badge describing the alert kind. */
export function AlertAvatar({ alert, size = 40 }: { alert: SocialAlert; size?: number }) {
  const badge = KIND_BADGE[alert.kind];
  const badgeSize = Math.round(size * 0.45);
  return (
    <Box sx={{ position: "relative", flexShrink: 0 }}>
      <Avatar
        src={alert.actor.avatar_url ? publicAssetSrc(alert.actor.avatar_url) : undefined}
        sx={{ width: size, height: size, fontWeight: 700 }}
      >
        {alert.actor.display_name.slice(0, 1).toUpperCase()}
      </Avatar>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: -2,
          bottom: -2,
          width: badgeSize,
          height: badgeSize,
          borderRadius: "50%",
          bgcolor: badge.bg,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #fff",
        }}
      >
        {badge.icon}
      </Box>
    </Box>
  );
}
