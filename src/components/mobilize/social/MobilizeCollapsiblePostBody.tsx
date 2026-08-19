"use client";

import { Box, Button } from "@mui/material";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** If total text is under this (text-only), show everything. */
const FULL_THRESHOLD = 450;
/** Approximate line height in px for measuring 1 line. */
const LINE_HEIGHT_PX = 24;
/** Number of lines to show for text-only posts that need clamping. */
const TEXT_CLAMP_LINES = 3;

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
 * Smart collapsible post body using height-based clamping.
 *
 * - Text-only posts ≤ 450 chars → show everything (no clamp).
 * - Text-only posts > 450 chars → clamp at 3 lines + More / Less.
 * - Posts with images → always clamp at 1 line + More / Less.
 *
 * Uses height measurement instead of webkitLineClamp so it works
 * with block-level children (Box, Stack, etc.).
 */
export function MobilizeCollapsiblePostBody({
  text,
  media,
  surface = "light",
  plain,
  hasImages = false,
}: Props) {
  const fullText = (plain ?? "").trim();
  const charCount = fullText.length;

  // Text-only posts short enough → no clamp
  const skipClamp = !hasImages && charCount > 0 && charCount <= FULL_THRESHOLD;

  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullHeightRef = useRef<number | null>(null);
  const measuredRef = useRef(false);

  // Measure heights after render to determine if collapse is needed
  useEffect(() => {
    if (skipClamp) {
      setNeedsCollapse(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    // Allow layout to settle, then measure
    const raf = requestAnimationFrame(() => {
      // Measure full height
      const prevMaxHeight = el.style.maxHeight;
      const prevOverflow = el.style.overflow;

      el.style.transition = "none";
      el.style.maxHeight = "none";
      el.style.overflow = "visible";

      const full = el.scrollHeight;

      // Determine collapsed height:
      // - Image posts: 1 line
      // - Text-only long posts: 3 lines
      const lines = hasImages ? 1 : TEXT_CLAMP_LINES;
      const target = lines * LINE_HEIGHT_PX;

      // Restore
      el.style.maxHeight = prevMaxHeight;
      el.style.overflow = prevOverflow;
      el.style.transition = "";

      fullHeightRef.current = full;
      setCollapsedHeight(target);
      setNeedsCollapse(full > target + 4);
      measuredRef.current = true;
    });

    return () => cancelAnimationFrame(raf);
  }, [skipClamp, text, hasImages]);

  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          maxHeight:
            skipClamp || !needsCollapse || expanded
              ? "none"
              : collapsedHeight ?? "none",
          transition: needsCollapse && !skipClamp
            ? "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      >
        {text}
        {!skipClamp && needsCollapse && !expanded ? (
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
      {needsCollapse && !skipClamp ? (
        <Button
          size="small"
          onClick={toggle}
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
          {expanded ? "Less" : "More"}
        </Button>
      ) : null}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}
