"use client";

import { Box, Button, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const MAX_HEIGHT_PX = 130;

type Props = {
  text: string;
};

export function MobilizeGroupAboutText({ text }: Props) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      setOverflows(el.scrollHeight > MAX_HEIGHT_PX + 1);
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  return (
    <Box>
      <Typography
        ref={contentRef}
        variant="body2"
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.65,
          color: "rgba(0,0,0,0.78)",
          maxHeight: expanded ? "none" : MAX_HEIGHT_PX,
          overflow: expanded ? "visible" : "hidden",
        }}
      >
        {text}
      </Typography>
      {overflows ? (
        <Button
          size="small"
          onClick={() => setExpanded((v) => !v)}
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
}
