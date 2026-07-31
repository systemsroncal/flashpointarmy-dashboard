"use client";

import { Box } from "@mui/material";
import { useState } from "react";
import { ChapterInviteShareDialog } from "./ChapterInviteShareDialog";

export const INVITE_FRIENDS_BANNER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/07/invite-FP.png";

export function InviteFriendsBanner({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [open, setOpen] = useState(false);
  const isCompact = variant === "compact";

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Invite someone to join FlashPoint Army"
        sx={{
          display: "block",
          width: isCompact ? { xs: "100%", sm: 240, md: 280 } : "100%",
          maxWidth: isCompact ? 320 : undefined,
          p: 0,
          mb: isCompact ? 0 : 1.25,
          border: "none",
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          bgcolor: "transparent",
          flexShrink: 0,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        <Box
          component="img"
          src={INVITE_FRIENDS_BANNER_URL}
          alt="Invite friends — Let's reach 20k members together"
          sx={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </Box>

      <ChapterInviteShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
