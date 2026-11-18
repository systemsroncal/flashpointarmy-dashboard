"use client";

import {
  CLAMP_ACCORDION_TRANSITION,
  useClampAccordion,
} from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import { type ReactNode } from "react";

/** Collapsed line count for text-only feed posts. */
const FEED_TEXT_CLAMP_LINES = 4;
/** Collapsed line count when the post has images. */
const FEED_IMAGE_TEXT_CLAMP_LINES = 1;

type Props = {
  text: ReactNode;
  media?: ReactNode;
  surface?: "light" | "dark";
  plain?: string;
  hasImages?: boolean;
};

/**
 * Collapsible post body (4 lines text-only, 1 line when images).
 * Uses line-clamp measurement — avoids tall posts showing extra lines from a loose max-height.
 */
export function MobilizeCollapsiblePostBody({
  text,
  media,
  surface = "light",
  plain,
  hasImages = false,
}: Props) {
  const lineCount = hasImages ? FEED_IMAGE_TEXT_CLAMP_LINES : FEED_TEXT_CLAMP_LINES;
  const accordion = useClampAccordion(lineCount);
  const noText = !(plain ?? "").trim();

  const clampSx = {
    display: "-webkit-box",
    WebkitLineClamp: lineCount,
    WebkitBoxOrient: "vertical",
  } as const;

  const moreLabel = hasImages ? "More" : "Read more";
  const lessLabel = hasImages ? "Less" : "Read less";

  if (noText) {
    return media ? <Box sx={{ mt: 0 }}>{media}</Box> : null;
  }

  return (
    <Box>
      <Box
        ref={accordion.ref}
        onTransitionEnd={accordion.onTransitionEnd}
        sx={{
          position: "relative",
          overflow: "hidden",
          lineHeight: 1.55,
          fontSize: "0.875rem",
          maxHeight: accordion.maxHeight ?? "none",
          transition:
            accordion.ready && accordion.needsCollapse ? CLAMP_ACCORDION_TRANSITION : "none",
          ...(accordion.showClamp ? clampSx : {}),
        }}
      >
        {text}
      </Box>
      {accordion.needsCollapse ? (
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
          {accordion.expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}