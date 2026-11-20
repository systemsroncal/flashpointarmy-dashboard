"use client";

import { useClampAccordion } from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import { type ReactNode } from "react";

/** Collapsed line count for text-only feed posts. */
const FEED_TEXT_CLAMP_LINES = 4;
/** Collapsed lines when the post has images or video (max 3). */
const FEED_MEDIA_TEXT_CLAMP_LINES = 3;

type Props = {
  text: ReactNode;
  media?: ReactNode;
  surface?: "light" | "dark";
  plain?: string;
  /** Post has attached image grid and/or embedded video below the text. */
  hasMedia?: boolean;
};

const clampSx = (lineCount: number) =>
  ({
    display: "-webkit-box",
    WebkitLineClamp: lineCount,
    WebkitBoxOrient: "vertical",
  }) as const;

const toggleBtnSx = (surface: "light" | "dark") =>
  ({
    px: 0,
    minWidth: 0,
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.875rem",
    color: surface === "dark" ? "#b0b3b8" : "#525252",
    textDecoration: "underline",
    verticalAlign: "baseline",
    "&:hover": {
      bgcolor: "transparent",
      textDecoration: "underline",
      color: surface === "dark" ? "#d0d2d6" : "#3a3a3a",
    },
  }) as const;

/**
 * Collapsible post body (4 lines text-only, up to 3 when media is present).
 */
export function MobilizeCollapsiblePostBody({
  text,
  media,
  surface = "light",
  plain,
  hasMedia = false,
}: Props) {
  const lineCount = hasMedia ? FEED_MEDIA_TEXT_CLAMP_LINES : FEED_TEXT_CLAMP_LINES;
  const accordion = useClampAccordion(lineCount, plain, { mode: "line-clamp" });
  const noText = !(plain ?? "").trim();

  const moreLabel = hasMedia ? "More" : "Read more";
  const lessLabel = hasMedia ? "Less" : "Read less";
  const fadeRgb = surface === "dark" ? "13, 17, 23" : "255, 255, 255";

  if (noText) {
    return media ? <Box sx={{ mt: 0 }}>{media}</Box> : null;
  }

  const inlineMore =
    hasMedia && accordion.needsCollapse && !accordion.expanded ? (
      <Box
        component="span"
        sx={{
          position: "absolute",
          right: 0,
          bottom: 0,
          display: "inline-flex",
          alignItems: "baseline",
          gap: 0.15,
          pl: 2.5,
          lineHeight: 1.45,
          fontSize: "0.9375rem",
          background: `linear-gradient(to right, rgba(${fadeRgb}, 0) 0%, rgba(${fadeRgb}, 0.92) 38%, rgba(${fadeRgb}, 1) 55%)`,
          pointerEvents: "none",
          "& button": { pointerEvents: "auto" },
        }}
      >
        <Box component="span" sx={{ color: surface === "dark" ? "#8b98a5" : "text.secondary" }}>…</Box>
        <Box
          component="button"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            accordion.toggle();
          }}
          sx={{
            ...toggleBtnSx(surface),
            p: 0,
            m: 0,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            lineHeight: "inherit",
            fontSize: "inherit",
            fontFamily: "inherit",
          }}
        >
          {moreLabel}
        </Box>
      </Box>
    ) : null;

  return (
    <Box>
      <Box sx={{ position: "relative" }}>
        <Box
          ref={accordion.ref}
          onTransitionEnd={accordion.onTransitionEnd}
          sx={{
            overflow: "hidden",
            lineHeight: 1.45,
            fontSize: "0.9375rem",
            "& .mobilize-feed-html": { lineHeight: 1.45 },
            "& .mobilize-feed-html p:first-of-type": { marginTop: 0, paddingTop: "0.18em" },
            transition: "none",
            ...(accordion.showClamp ? clampSx(lineCount) : {}),
          }}
        >
          {text}
        </Box>
        {inlineMore}
      </Box>
      {accordion.needsCollapse && (!hasMedia || accordion.expanded) ? (
        <Button
          type="button"
          size="small"
          onClick={accordion.toggle}
          sx={{
            ...toggleBtnSx(surface),
            mt: hasMedia && accordion.expanded ? 0.35 : 0.5,
            display: "inline",
          }}
        >
          {accordion.expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}