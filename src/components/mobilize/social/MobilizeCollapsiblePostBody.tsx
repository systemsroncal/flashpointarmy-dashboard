"use client";

import {
  CLAMP_ACCORDION_TRANSITION,
  useClampAccordion,
} from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import { type ReactNode, useMemo } from "react";

/** Max characters shown when a text-only post is clamped. */
const TEXT_CLAMP_CHARS = 300;
/** If the full text is under this threshold (text-only), show everything. */
const TEXT_FULL_THRESHOLD = 450;
/** Lines of text to show when the post also has images. */
const IMAGE_TEXT_LINES = 1;

type Props = {
  /** Post text block. */
  text: ReactNode;
  /** Post media (images) — never collapsed, always fully visible. */
  media?: ReactNode;
  /** Match post card surface for the fade overlay. */
  surface?: "light" | "dark";
  /** Plain text string used for character-count logic. */
  plain?: string;
  /** Whether the post actually has images/videos. */
  hasImages?: boolean;
};

/**
 * Smart collapsible post body.
 *
 * - Text-only posts: if full text ≤ 450 chars show everything (no clamp);
 *   otherwise clamp to ~300 chars / 5 lines.
 * - Posts with images: show only 1 line of text + More / Less.
 */
export function MobilizeCollapsiblePostBody({ text, media, surface = "light", plain, hasImages = false }: Props) {
  const fullCharCount = (plain ?? "").length;

  // For text-only posts that are short enough, skip the clamp entirely
  const skipClamp = !hasImages && fullCharCount > 0 && fullCharCount <= TEXT_FULL_THRESHOLD;

  // Number of lines to clamp: 1 when images present, otherwise 5
  const lineCount = hasImages ? IMAGE_TEXT_LINES : 5;
  const accordion = useClampAccordion(skipClamp ? 9999 : lineCount);
  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  const clampSx = useMemo(
    () =>
      ({
        display: "-webkit-box",
        WebkitLineClamp: lineCount,
        WebkitBoxOrient: "vertical",
      }) as const,
    [lineCount],
  );

  return (
    <Box>
      <Box
        ref={accordion.ref}
        onTransitionEnd={accordion.onTransitionEnd}
        sx={{
          position: "relative",
          overflow: "hidden",
          maxHeight: skipClamp ? "none" : accordion.maxHeight ?? "none",
          transition:
            accordion.ready && accordion.needsCollapse ? CLAMP_ACCORDION_TRANSITION : "none",
          ...(accordion.showClamp ? clampSx : {}),
        }}
      >
        {text}
        {accordion.showClamp ? (
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 28,
              background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${fadeTo} 90%)`,
            }}
          />
        ) : null}
      </Box>
      {accordion.needsCollapse && !skipClamp ? (
        <Button
          size="small"
          onClick={accordion.toggle}
          sx={{
            mt: 0.5,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: surface === "dark" ? "#b0b3b8" : "#525252",
            textDecoration: "underline",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "underline",
              color: surface === "dark" ? "#d0d2d6" : "#3a3a3a",
            },
          }}
        >
          {accordion.expanded ? "Less" : "More"}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}
