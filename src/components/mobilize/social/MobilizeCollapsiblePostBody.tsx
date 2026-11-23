"use client";

import { useClampAccordion } from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import { type ReactNode } from "react";

/** Collapsed line count for all feed posts (text, image, video, URL). */
const FEED_CLAMP_LINES = 4;

type Props = {
  text: ReactNode;
  media?: ReactNode;
  /** OG link preview cards — always visible below the clamped text (Facebook-style). */
  trailing?: ReactNode;
  surface?: "light" | "dark";
  plain?: string;
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
 * Collapsible post body (4 lines) with optional link preview always visible below.
 */
export function MobilizeCollapsiblePostBody({
  text,
  media,
  trailing,
  surface = "light",
  plain,
}: Props) {
  const accordion = useClampAccordion(FEED_CLAMP_LINES, plain, { mode: "line-clamp" });
  const noText = !(plain ?? "").trim();

  const moreLabel = "Read more";
  const lessLabel = "Read less";

  if (noText) {
    return (
      <>
        {trailing ? <Box>{trailing}</Box> : null}
        {media ? <Box sx={{ mt: trailing ? 1.25 : 0 }}>{media}</Box> : null}
      </>
    );
  }

  return (
    <Box>
      <Box
        ref={accordion.ref}
        onTransitionEnd={accordion.onTransitionEnd}
        sx={{
          lineHeight: 1.45,
          fontSize: "0.9375rem",
          "& .mobilize-feed-html, & .mobilize-feed-plain": { lineHeight: 1.45 },
          "& .mobilize-feed-html p:first-of-type, & .mobilize-feed-plain p:first-of-type": {
            marginTop: 0,
            paddingTop: "0.18em",
          },
          ...(accordion.showClamp
            ? {
                "& .mobilize-feed-html, & .mobilize-feed-plain": {
                  ...clampSx(FEED_CLAMP_LINES),
                  overflow: "hidden",
                  wordBreak: "break-word",
                },
                "& .mobilize-feed-html p, & .mobilize-feed-plain p": {
                  display: "inline",
                  margin: 0,
                  marginBottom: 0,
                  paddingTop: 0,
                },
                "& .mobilize-feed-html p:first-of-type, & .mobilize-feed-plain p:first-of-type": {
                  paddingTop: "0.18em",
                },
                "& .mobilize-feed-html p:not(:last-child)::after, & .mobilize-feed-plain p:not(:last-child)::after":
                  {
                    content: '"\\A"',
                    whiteSpace: "pre",
                  },
              }
            : {}),
        }}
      >
        {text}
      </Box>
      {accordion.needsCollapse ? (
        <Button
          type="button"
          size="small"
          onClick={accordion.toggle}
          sx={{
            ...toggleBtnSx(surface),
            mt: 0.5,
            display: "inline",
          }}
        >
          {accordion.expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
      {trailing ? <Box sx={{ mt: 1 }}>{trailing}</Box> : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}