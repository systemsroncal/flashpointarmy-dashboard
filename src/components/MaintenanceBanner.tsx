"use client";

import {
  MAINTENANCE_BANNER_BODY,
  MAINTENANCE_BANNER_OFFSET_VAR,
} from "@/lib/maintenance";
import { Box, Typography } from "@mui/material";
import { useLayoutEffect, useRef } from "react";

export function MaintenanceBanner() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;

    function syncOffset() {
      const h = ref.current?.offsetHeight ?? 0;
      root.style.setProperty(
        MAINTENANCE_BANNER_OFFSET_VAR,
        h > 0 ? `${h}px` : "0px"
      );
    }

    syncOffset();
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(syncOffset);
    ro.observe(el);
    window.addEventListener("resize", syncOffset);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncOffset);
      root.style.setProperty(MAINTENANCE_BANNER_OFFSET_VAR, "0px");
    };
  }, []);

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
        px: { xs: 1.5, sm: 2.5 },
        py: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Typography
        component="p"
        sx={{
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          lineHeight: 1.55,
          textAlign: "center",
          maxWidth: 1100,
          mx: "auto",
          m: 0,
        }}
      >
        <Box component="span" sx={{ fontWeight: 700 }}>
          Maintenance:
        </Box>{" "}
        {MAINTENANCE_BANNER_BODY}
      </Typography>
    </Box>
  );
}
