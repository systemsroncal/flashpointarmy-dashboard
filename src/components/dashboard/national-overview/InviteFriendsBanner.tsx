"use client";

import { Box, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { ChapterInviteShareDialog } from "./ChapterInviteShareDialog";

export const INVITE_FRIENDS_BANNER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/07/invite-FP.png";

export const NINE_K_USERS_BANNER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/08/9k-users-banner-img.png";

/** Milliseconds each slide stays visible before auto-advancing. */
const SLIDE_DURATION_MS = 4500;

type Slide = {
  url: string;
  alt: string;
  opensShareDialog?: boolean;
};

const SLIDES: Slide[] = [
  {
    url: INVITE_FRIENDS_BANNER_URL,
    alt: "Invite friends — Let's reach 20k members together",
    opensShareDialog: true,
  },
  {
    url: NINE_K_USERS_BANNER_URL,
    alt: "9,000+ members strong — join the movement",
  },
];

/**
 * Auto-playing banner carousel in an infinite loop: each slide stays for
 * SLIDE_DURATION_MS, then the track slides to the next one forever. Slide 1 is
 * the invite-friends CTA (opens the share dialog); additional slides are static.
 */
export function InviteFriendsBanner({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const isCompact = variant === "compact";
  const count = SLIDES.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <>
      <Box
        role="region"
        aria-label="FlashPoint Army announcements"
        sx={{
          width: isCompact ? { xs: "100%", sm: 240, md: 280 } : "100%",
          maxWidth: isCompact ? 320 : undefined,
          mb: isCompact ? 0 : 1.25,
          borderRadius: 2,
          overflow: "hidden",
          flexShrink: 0,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            transform: `translateX(-${index * 100}%)`,
            transition: "transform 0.65s ease",
          }}
        >
          {SLIDES.map((slide) => (
            <Box key={slide.url} sx={{ flex: "0 0 100%", minWidth: 0 }}>
              {slide.opensShareDialog ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Invite someone to join FlashPoint Army"
                  sx={{
                    display: "block",
                    width: "100%",
                    p: 0,
                    border: "none",
                    overflow: "hidden",
                    cursor: "pointer",
                    bgcolor: "transparent",
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={slide.url}
                    alt={slide.alt}
                    sx={{ display: "block", width: "100%", height: "auto" }}
                  />
                </Box>
              ) : (
                <Box
                  component="img"
                  src={slide.url}
                  alt={slide.alt}
                  sx={{ display: "block", width: "100%", height: "auto" }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1, pb: 0.75 }}>
          {SLIDES.map((slide, i) => (
            <Box
              key={slide.url}
              component="button"
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                border: "none",
                p: 0,
                cursor: "pointer",
                bgcolor: i === index ? "#fff" : "rgba(255,255,255,0.35)",
                transition: "background-color 0.2s ease",
              }}
            />
          ))}
        </Stack>
      </Box>

      <ChapterInviteShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
