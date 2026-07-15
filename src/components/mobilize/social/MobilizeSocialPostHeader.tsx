"use client";

import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Avatar, Box, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";

export type MobilizeSocialAuthor = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
};

type Props = {
  author: MobilizeSocialAuthor;
  createdAt?: string;
  size?: "sm" | "md";
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export function MobilizeSocialPostHeader({ author, createdAt, size = "md" }: Props) {
  const avatarSize = size === "sm" ? 32 : 44;
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
      <Link href={mobilizeMemberProfileHref(author.id)} style={{ textDecoration: "none", flexShrink: 0 }}>
        <Avatar
          src={author.avatar_url ? publicAssetSrc(author.avatar_url) : undefined}
          alt=""
          sx={{ width: avatarSize, height: avatarSize, bgcolor: "#263238" }}
        >
          {author.display_name.charAt(0)}
        </Avatar>
      </Link>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <MuiLink
          component={Link}
          href={mobilizeMemberProfileHref(author.id)}
          underline="hover"
          sx={{ fontWeight: 700, color: "#111", fontSize: size === "sm" ? "0.85rem" : "0.95rem" }}
        >
          {author.display_name}
        </MuiLink>
        <Typography variant="caption" display="block" sx={{ color: "#6b7280", lineHeight: 1.3 }}>
          {author.handle}
          {createdAt ? ` · ${formatRelativeTime(createdAt)}` : ""}
        </Typography>
      </Box>
    </Box>
  );
}
