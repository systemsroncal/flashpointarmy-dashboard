"use client";

import { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";

const COOKIE_NAME = "fp_video_cam_tooltip_shown";
const AUTO_SHOW_DURATION_MS = 4000;

function getCookieValue(name: string): number {
  if (typeof document === "undefined") return 0;
  const match = document.cookie.split(";").find((c) => c.trim().startsWith(`${name}=`));
  if (!match) return 0;
  const val = match.split("=")[1]?.trim();
  return Number(val) || 0;
}

function setCookieValue(name: string, value: number, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function MobilizeVideoCamIcon() {
  const [autoShow, setAutoShow] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);

  useEffect(() => {
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
    const shownCount = getCookieValue(COOKIE_NAME);
    if (shownCount < 2) {
      setAutoShow(true);
      setCookieValue(COOKIE_NAME, shownCount + 1, COOKIE_MAX_AGE);
      const timer = setTimeout(() => setAutoShow(false), AUTO_SHOW_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Tooltip
      title="Watch Video About Chapters & Groups"
      open={autoShow || hoverOpen}
      onOpen={() => setHoverOpen(true)}
      onClose={() => setHoverOpen(false)}
      disableHoverListener={autoShow}
    >
      <IconButton
        color="inherit"
        size="small"
        aria-label="Watch Video About Chapters & Groups"
        onClick={() => {
          window.dispatchEvent(new Event("fp-reopen-video-popup"));
        }}
      >
        <VideocamOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}
