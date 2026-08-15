"use client";

import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import {
  publishFollowState,
  readFollowState,
  subscribeFollowState,
} from "@/lib/mobilize/social/follow-state-bus";
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

/** Opacity only — the transform track belongs to the nudge below. */
const followedFade = keyframes({
  "0%": { opacity: 0 },
  "6%": { opacity: 1 },
  "88%": { opacity: 1 },
  "100%": { opacity: 0 },
});

/** Small repeating tilt so the icon reads as feedback without growing. */
const followedNudge = keyframes({
  "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
  "20%": { transform: "translateY(-2px) rotate(-10deg)" },
  "45%": { transform: "translateY(0) rotate(0deg)" },
  "65%": { transform: "translateY(-1px) rotate(7deg)" },
  "85%": { transform: "translateY(0) rotate(0deg)" },
});

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
    readFollowState(author.id) ?? author.is_following !== false
  );
  const [followBusy, setFollowBusy] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFollowing(readFollowState(author.id) ?? author.is_following !== false);
  }, [author.id, author.is_following]);

  useEffect(
    () =>
      subscribeFollowState((authorId, next) => {
        if (authorId === author.id) setFollowing(next);
      }),
    [author.id]
  );

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
      publishFollowState(author.id, true);
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
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, minWidth: 0 }}>
            <MuiLink
              component={Link}
              href={mobilizeMemberProfileHref(author.id)}
              underline="hover"
              sx={{ fontWeight: 700, color: nameColor, fontSize: size === "sm" ? "0.85rem" : "0.95rem" }}
            >
              {author.display_name}
            </MuiLink>
            {author.verified ? (
              <VerifiedUserBadge size={size === "sm" ? 18 : 20} verifiedAt={author.verified_at} />
            ) : null}
          </Box>
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
                  animation: `${followedFade} ${FOLLOWED_HINT_MS}ms ease-out forwards`,
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    transformOrigin: "60% 80%",
                    animation: `${followedNudge} 1.1s ease-in-out infinite`,
                    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                  }}
                >
                  <ThumbUpOutlinedIcon sx={{ fontSize: size === "sm" ? 15 : 17 }} />
                </Box>
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
