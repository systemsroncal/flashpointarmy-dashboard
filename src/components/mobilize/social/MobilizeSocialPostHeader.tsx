"use client";

import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import { Avatar, Box, Button, Chip, Link as MuiLink, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import Link from "next/link";
import { flashpointYellow } from "@/theme/tokens";
import { useEffect, useRef, useState } from "react";

export type MobilizeSocialAuthor = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  verified?: boolean;
  verified_at?: string | null;
  /** Undefined when the feed was loaded without viewer context (follow state unknown). */
  is_following?: boolean;
};

type Props = {
  author: MobilizeSocialAuthor;
  createdAt?: string;
  size?: "sm" | "md";
  tone?: "light" | "dark";
  roleLabel?: string;
  /** Current viewer — used to hide Follow on own posts. */
  viewerUserId?: string;
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

/** How long the "we got it" confirmation stays on screen after following. */
const FOLLOWED_HINT_MS = 5000;

const followedPop = keyframes({
  "0%": { opacity: 0, transform: "scale(0.5) translateY(4px)" },
  "18%": { opacity: 1, transform: "scale(1.15) translateY(0)" },
  "32%": { transform: "scale(1)" },
  "82%": { opacity: 1, transform: "scale(1)" },
  "100%": { opacity: 0, transform: "scale(0.9)" },
});

/**
 * A feed can show several posts by the same author. Following from one of them
 * has to hide the button on the others, so headers share the result in-page.
 */
const followedAuthorIds = new Set<string>();
const followListeners = new Set<(authorId: string) => void>();

function announceFollowed(authorId: string) {
  followedAuthorIds.add(authorId);
  for (const listener of followListeners) listener(authorId);
}

const FOLLOW_BTN_SX = {
  textTransform: "none" as const,
  fontWeight: 700,
  fontSize: "0.75rem",
  lineHeight: 1.2,
  minHeight: 24,
  px: 1.25,
  py: 0.25,
  borderRadius: "6px",
  boxShadow: "none",
  bgcolor: "#e7f3ff",
  color: "#1877f2",
  "&:hover": { bgcolor: "#d8eaff", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#f0f2f5", color: "rgba(0,0,0,0.4)" },
};

export function MobilizeSocialPostHeader({
  author,
  createdAt,
  size = "md",
  tone = "light",
  roleLabel,
  viewerUserId,
}: Props) {
  const avatarSize = size === "sm" ? 32 : 44;
  const isDark = tone === "dark";
  const nameColor = isDark ? "#e7e9ea" : "#111";
  const metaColor = isDark ? "#8b98a5" : "#6b7280";
  const isOwn = Boolean(viewerUserId && viewerUserId === author.id);
  // Only offer Follow when the feed told us the viewer is *not* following yet.
  // `undefined` means unknown, and guessing "not following" shows the button to
  // people who already follow the author (e.g. on their profile page).
  const [following, setFollowing] = useState(
    author.is_following !== false || followedAuthorIds.has(author.id)
  );
  const [followBusy, setFollowBusy] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFollowing(author.is_following !== false || followedAuthorIds.has(author.id));
  }, [author.id, author.is_following]);

  useEffect(() => {
    const listener = (authorId: string) => {
      if (authorId === author.id) setFollowing(true);
    };
    followListeners.add(listener);
    return () => {
      followListeners.delete(listener);
    };
  }, [author.id]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  async function followAuthor() {
    if (isOwn || following || followBusy) return;
    setFollowBusy(true);
    try {
      const res = await fetch(`/api/mobilize/social/profiles/${author.id}/follow`, {
        method: "POST",
      });
      const json = (await res.json()) as { error?: string; is_following?: boolean };
      if (!res.ok) throw new Error(json.error || "Follow failed.");
      setFollowing(true);
      announceFollowed(author.id);
      setJustFollowed(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setJustFollowed(false), FOLLOWED_HINT_MS);
    } finally {
      setFollowBusy(false);
    }
  }

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <MuiLink
            component={Link}
            href={mobilizeMemberProfileHref(author.id)}
            underline="hover"
            sx={{ fontWeight: 700, color: nameColor, fontSize: size === "sm" ? "0.85rem" : "0.95rem" }}
          >
            {author.display_name}
          </MuiLink>
          {author.verified ? (
            <VerifiedUserBadge size={size === "sm" ? 14 : 16} verifiedAt={author.verified_at} />
          ) : null}
          {!isOwn && !following ? (
            <Button
              size="small"
              disabled={followBusy}
              onClick={() => void followAuthor()}
              sx={FOLLOW_BTN_SX}
            >
              {followBusy ? "…" : "Follow"}
            </Button>
          ) : justFollowed ? (
            <Tooltip title={`You're now following ${author.display_name}`}>
              <Box
                role="status"
                aria-label="Now following"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "#65676b",
                  animation: `${followedPop} ${FOLLOWED_HINT_MS}ms ease-out forwards`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              >
                <ThumbUpOutlinedIcon sx={{ fontSize: size === "sm" ? 15 : 17 }} />
              </Box>
            </Tooltip>
          ) : null}
          {roleLabel ? (
            <Chip
              label={roleLabel}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.68rem",
                fontWeight: 800,
                bgcolor: flashpointYellow,
                color: "#0d0d0d",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          ) : null}
        </Box>
        <Typography variant="caption" display="block" sx={{ color: metaColor, lineHeight: 1.3 }}>
          {author.handle}
          {createdAt ? ` · ${formatRelativeTime(createdAt)}` : ""}
        </Typography>
      </Box>
    </Box>
  );
}
