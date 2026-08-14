"use client";

import { Box, Stack } from "@mui/material";
import { useEffect, useState, type TransitionEvent } from "react";
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
  /** Kept in the rotation config but not rendered. */
  hidden?: boolean;
};

const ALL_SLIDES: Slide[] = [
  {
    url: INVITE_FRIENDS_BANNER_URL,
    alt: "Invite friends — Let's reach 20k members together",
    opensShareDialog: true,
  },
  {
    url: NINE_K_USERS_BANNER_URL,
    alt: "9,000+ members strong — join the movement",
    hidden: true,
  },
];

const SLIDES = ALL_SLIDES.filter((s) => !s.hidden);

const SET_SIZE = SLIDES.length;
const HAS_CAROUSEL = SET_SIZE > 1;

/**
 * Auto-playing banner carousel that always advances forward (slides enter from
 * the right and exit to the left) in an infinite loop. The track renders one
 * extra clone of the first slide; once the clone finishes its transition the
 * transform is rewound invisibly (same slide is on screen) so the loop never
 * slides backward. Slide 1 is the invite-friends CTA (opens the share dialog).
 */
export function InviteFriendsBanner({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const isCompact = variant === "compact";

  // One extra clone of the first slide enables the seamless forward-only loop.
  const total = HAS_CAROUSEL ? SET_SIZE + 1 : 1;
  const rendered = Array.from({ length: total }, (_, i) => SLIDES[i % SET_SIZE]);

  // Re-enable the slide transition right after an invisible rewind.
  useEffect(() => {
    if (!instant) return;
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  // Auto-advance forward forever.
  useEffect(() => {
    if (!HAS_CAROUSEL) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [total]);

  function handleTrackTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    // After the cloned first slide, rewind to the real first slide without a
    // transition — the visible slide is identical, so the loop is seamless.
    if (index >= total - 1) {
      setInstant(true);
      setIndex(index - SET_SIZE);
    }
  }

  const activeSlide = index % SET_SIZE;

  return (
    <>
      <Box
        role="region"
        aria-label="FlashPoint Army announcements"
        sx={{
          width: isCompact ? { xs: "100%", sm: 240, md: 280 } : "100%",
          maxWidth: isCompact ? 320 : undefined,
          mb: isCompact ? 0 : 1.25,
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
          onTransitionEnd={handleTrackTransitionEnd}
          sx={{
            display: "flex",
            transform: `translateX(-${index * 100}%)`,
            transition: instant ? "none" : "transform 0.65s ease",
          }}
        >
          {rendered.map((slide, i) => (
            <Box key={`${slide.url}-${i}`} sx={{ flex: "0 0 100%", minWidth: 0 }}>
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
        {HAS_CAROUSEL ? (
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
                bgcolor: i === activeSlide ? "#fff" : "rgba(255,255,255,0.35)",
                transition: "background-color 0.2s ease",
              }}
            />
          ))}
        </Stack>
        ) : null}
      </Box>

      <ChapterInviteShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
