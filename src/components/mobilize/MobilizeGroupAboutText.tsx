"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const MAX_HEIGHT_PX = 130;
const EXPAND_TRANSITION = "max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)";

type Props = {
  text: string;
};

export function MobilizeGroupAboutText({ text }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [contentHeight, setContentHeight] = useState(MAX_HEIGHT_PX);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      const height = el.scrollHeight;
      setContentHeight(height);
      setOverflows(height > MAX_HEIGHT_PX + 1);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <Box>
      <Box
        sx={{
          maxHeight: overflows ? (expanded ? contentHeight : MAX_HEIGHT_PX) : "none",
          overflow: "hidden",
          transition: overflows ? EXPAND_TRANSITION : "none",
        }}
      >
        <Typography
          ref={contentRef}
          variant="body2"
          component="div"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.65,
            color: "rgba(0,0,0,0.78)",
            fontSize: "calc(0.875rem - 2pt + 2px)",
          }}
        >
          {text}
        </Typography>
      </Box>
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
          }}
        >
          {expanded ? "Read less" : "Read more"}
        </Button>
      ) : null}
    </Box>
  );
};
