"use client";

import { Box, Button } from "@mui/material";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** Character threshold — text-only posts at or below this show everything. */
const FULL_THRESHOLD = 450;
/** Collapsed max-height in px for text-only posts > 450 chars. */
const TEXT_CLAMP_HEIGHT = 170;
/** Collapsed max-height in px for image posts (heading + ~2 lines of text). */
const IMAGE_CLAMP_HEIGHT = 60;

type Props = {
  text: ReactNode;
  media?: ReactNode;
  surface?: "light" | "dark";
  plain?: string;
  hasImages?: boolean;
};

/**
 * Smart collapsible post body.
 *
 * - Posts with images  → clamp text to 1 line + "More" / "Less", images always visible.
 * - Text-only ≤ 450 chars → show everything (no toggle).
 * - Text-only > 450 chars  → clamp at 170px + "Read more" / "Read less".
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

  // Text-only posts short enough → no clamp at all
  const skipClamp = !hasImages && charCount > 0 && charCount <= FULL_THRESHOLD;

  // No text content → no clamp
  const noText = charCount === 0;

  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure after render to determine if collapse is needed
  useEffect(() => {
    if (skipClamp || noText) {
      setNeedsCollapse(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => {
      // Temporarily remove clamp to measure full height
      const prevMax = el.style.maxHeight;
      const prevOverflow = el.style.overflow;
      el.style.transition = "none";
      el.style.maxHeight = "none";
      el.style.overflow = "visible";

      const full = el.scrollHeight;

      el.style.maxHeight = prevMax;
      el.style.overflow = prevOverflow;
      el.style.transition = "";

      const collapsedHeight = hasImages ? IMAGE_CLAMP_HEIGHT : TEXT_CLAMP_HEIGHT;
      setNeedsCollapse(full > collapsedHeight + 4);
    });

    return () => cancelAnimationFrame(raf);
  }, [skipClamp, noText, text, hasImages]);

  // Collapsed height value
  const collapsedHeight = hasImages ? IMAGE_CLAMP_HEIGHT : TEXT_CLAMP_HEIGHT;

  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  // Determine button labels: "More"/"Less" for image posts, "Read more"/"Read less" for text-only
  const moreLabel = hasImages ? "More" : "Read more";
  const lessLabel = hasImages ? "Less" : "Read less";

  const shouldCollapse = !skipClamp && !noText && needsCollapse;

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          maxHeight:
            !shouldCollapse || expanded
              ? "none"
              : collapsedHeight,
          transition: shouldCollapse
            ? "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      >
        {text}
        {/* Gradient fade when collapsed */}
        {shouldCollapse && !expanded ? (
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
      {/* Toggle button */}
      {shouldCollapse ? (
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
          {expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
      {/* Media renders BELOW text, always visible */}
      {media ? <Box sx={{ mt: 1.25 }}>{media}</Box> : null}
    </Box>
  );
}
