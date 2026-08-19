"use client";

import {
  CLAMP_ACCORDION_TRANSITION,
  useClampAccordion,
} from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** Characters shown when collapsed. */
const TEXT_CLAMP_CHARS = 300;
/** If total text is under this (text-only), show everything. */
const TEXT_FULL_THRESHOLD = 450;

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
 * - Posts with images: always clamp to 1 line + More / Less.
 * - Text-only posts ≤ 450 chars → show everything (no clamp).
 * - Text-only posts > 450 chars → clamp at ~300 chars / 1 line + More / Less.
 */
export function MobilizeCollapsiblePostBody({ text, media, surface = "light", plain, hasImages = false }: Props) {
  const fullCharCount = (plain ?? "").length;

  // Text-only posts short enough → no clamp at all
  const skipClamp = !hasImages && fullCharCount > 0 && fullCharCount <= TEXT_FULL_THRESHOLD;

  // For clamping: use 1 line (works for both image and long-text posts)
  const accordion = useClampAccordion(skipClamp ? 9999 : 1);
  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

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
          ...(accordion.showClamp
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
              }
            : {}),
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
