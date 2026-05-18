"use client";

import {
  MAINTENANCE_BANNER_BODY,
  MAINTENANCE_BANNER_DISMISS_KEY,
  MAINTENANCE_BANNER_OFFSET_VAR,
} from "@/lib/maintenance";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(MAINTENANCE_BANNER_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function MaintenanceBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(true);

  const syncOffset = useCallback(() => {
    const root = document.documentElement;
    if (dismissed) {
      root.style.setProperty(MAINTENANCE_BANNER_OFFSET_VAR, "0px");
      return;
    }
    const h = ref.current?.offsetHeight ?? 0;
    root.style.setProperty(
      MAINTENANCE_BANNER_OFFSET_VAR,
      h > 0 ? `${h}px` : "0px"
    );
  }, [dismissed]);

  useLayoutEffect(() => {
    setDismissed(readDismissed());
  }, []);

  useLayoutEffect(() => {
    syncOffset();
    if (dismissed) return;

    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(syncOffset);
    ro.observe(el);
    window.addEventListener("resize", syncOffset);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncOffset);
    };
  }, [dismissed, syncOffset]);

  useLayoutEffect(() => {
    return () => {
      document.documentElement.style.setProperty(
        MAINTENANCE_BANNER_OFFSET_VAR,
        "0px"
      );
    };
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(MAINTENANCE_BANNER_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
    document.documentElement.style.setProperty(
      MAINTENANCE_BANNER_OFFSET_VAR,
      "0px"
    );
  }

  if (dismissed) return null;

  return (
    <Box
      ref={ref}
      role="status"
      aria-live="polite"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1500,
        width: "100%",
        bgcolor: "#ffffff",
        color: "#1a191a",
        borderBottom: "1px solid #e5e7eb",
        px: { xs: 1, sm: 2 },
        py: { xs: 1.25, sm: 1.5 },
        display: "grid",
        gridTemplateColumns: { xs: "36px 1fr 36px", sm: "40px 1fr 40px" },
        alignItems: "start",
        columnGap: 0.5,
      }}
    >
      <Box aria-hidden sx={{ width: 1 }} />
      <Typography
        component="p"
        sx={{
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          lineHeight: 1.55,
          textAlign: "center",
          m: 0,
          justifySelf: "center",
          width: "100%",
        }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          Maintenance:
        </Box>{" "}
        {MAINTENANCE_BANNER_BODY}
      </Typography>
      <IconButton
        size="small"
        onClick={handleDismiss}
        aria-label="Dismiss maintenance notice"
        sx={{
          color: "#4b5563",
          justifySelf: "end",
          mt: -0.25,
          "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
