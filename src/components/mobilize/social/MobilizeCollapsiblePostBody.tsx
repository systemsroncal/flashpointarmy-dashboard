"use client";

import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

const MAX_TEXT_LINES = 5;

type Props = {
  /** Post text block (always clamped to 5 lines when collapsed). */
  text: ReactNode;
  /** Post media (images) — never collapsed, always fully visible. */
  media?: ReactNode;
  /** Match post card surface for the fade overlay. */
  surface?: "light" | "dark";
};

/** Collapses post TEXT only (max 5 lines); photos are always fully visible. */
export function MobilizeCollapsiblePostBody({ text, media, surface = "light" }: Props) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      // Temporarily force the 5-line clamp to detect overflow, then restore.
      const prev = {
        display: el.style.display,
        lineClamp: el.style.webkitLineClamp,
        boxOrient: el.style.webkitBoxOrient,
        overflow: el.style.overflow,
      };
      el.style.display = "-webkit-box";
      el.style.webkitLineClamp = String(MAX_TEXT_LINES);
      el.style.webkitBoxOrient = "vertical";
      el.style.overflow = "hidden";
      const overflows = el.scrollHeight > el.clientHeight + 4;
      el.style.display = prev.display;
      el.style.webkitLineClamp = prev.lineClamp;
      el.style.webkitBoxOrient = prev.boxOrient;
      el.style.overflow = prev.overflow;
      setNeedsCollapse(overflows);
    };
    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [text]);

  const clampSx = {
    display: "-webkit-box",
    WebkitLineClamp: MAX_TEXT_LINES,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as const;

  return (
    <Box>
      <Box
        ref={measureRef}
        sx={{
          position: "relative",
          ...(needsCollapse && !expanded ? clampSx : {}),
        }}
      >
        {text}
        {needsCollapse && !expanded ? (
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
      {needsCollapse ? (
        <Button
          size="small"
          onClick={() => setExpanded((v) => !v)}
          sx={{
            mt: 0.5,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "#0866ff",
            textDecoration: "underline",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          {expanded ? "Less" : "More"}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}
