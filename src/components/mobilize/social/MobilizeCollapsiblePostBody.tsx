"use client";

import {
  CLAMP_ACCORDION_TRANSITION,
  useClampAccordion,
} from "@/lib/mobilize/social/use-clamp-accordion";
import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";

const MAX_TEXT_LINES = 5;

type Props = {
  /** Post text block (always clamped to 5 lines when collapsed). */
  text: ReactNode;
  /** Post media (images) — never collapsed, always fully visible. */
  media?: ReactNode;
  /** Match post card surface for the fade overlay. */
  surface?: "light" | "dark";
};

/** Collapses post TEXT only (max 5 lines, accordion animation); photos are always fully visible. */
export function MobilizeCollapsiblePostBody({ text, media, surface = "light" }: Props) {
  const accordion = useClampAccordion(MAX_TEXT_LINES);
  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  const clampSx = {
    display: "-webkit-box",
    WebkitLineClamp: MAX_TEXT_LINES,
    WebkitBoxOrient: "vertical",
  } as const;

  return (
    <Box>
      <Box
        ref={accordion.ref}
        onTransitionEnd={accordion.onTransitionEnd}
        sx={{
          position: "relative",
          overflow: "hidden",
          maxHeight: accordion.maxHeight ?? "none",
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
          {accordion.expanded ? "Less" : "More"}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}
