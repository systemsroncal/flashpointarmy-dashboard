"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const COLLAPSED_LINES = 4;

type Props = {
  text: string;
};

export function MobilizeGroupAboutText({ text }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // Compare full content height against the collapsed height so the result
    // stays correct while expanded (clamped clientHeight is not usable then).
    function measure() {
      if (!el) return;
      const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
      setOverflows(el.scrollHeight > lineHeight * COLLAPSED_LINES + 1);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Box>
      <Typography
        ref={contentRef}
        variant="body2"
        component="div"
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.65,
          color: "rgba(0,0,0,0.78)",
          fontSize: "calc(0.875rem - 2pt + 2px)",
          ...(expanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: COLLAPSED_LINES,
                overflow: "hidden",
              }),
        }}
      >
        {text}
      </Typography>
      {overflows ? (
        <Button
          size="small"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          sx={{
            mt: 0.75,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
            color: "#525252",
            textDecoration: "underline",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "underline",
              color: "#3a3a3a",
            },
          }}
        >
          {expanded ? "Read less" : "Read more"}
        </Button>
      ) : null}
    </Box>
  );
}
