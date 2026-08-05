"use client";

import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

const COLLAPSE_HEIGHT_PX = 150;

type Props = {
  children: ReactNode;
  /** Match post card surface for the fade overlay. */
  surface?: "light" | "dark";
};

/** Collapses tall post bodies (text + images) behind Read more / Read less. */
export function MobilizeCollapsiblePostBody({ children, surface = "light" }: Props) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fadeTo = surface === "dark" ? "#0b0c16" : "#fff";

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const measure = () => {
      setNeedsCollapse(el.scrollHeight > COLLAPSE_HEIGHT_PX + 8);
    };
    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [children]);

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          maxHeight: needsCollapse && !expanded ? COLLAPSE_HEIGHT_PX : "none",
          overflow: needsCollapse && !expanded ? "hidden" : "visible",
        }}
      >
        <Box ref={measureRef}>{children}</Box>
        {needsCollapse && !expanded ? (
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 56,
              background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${fadeTo} 85%)`,
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
          {expanded ? "Read less" : "Read more"}
        </Button>
      ) : null}
    </Box>
  );
}
