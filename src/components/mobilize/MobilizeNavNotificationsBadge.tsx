"use client";

import { Box } from "@mui/material";
import { useMobilizeNotifications } from "@/components/mobilize/useMobilizeNotifications";

/** Pending join-request count for Mobilize drawer nav. */
export function MobilizeNavNotificationsBadge() {
  const { pendingCount } = useMobilizeNotifications();

  if (pendingCount < 1) return null;

  const label = pendingCount > 99 ? "99+" : String(pendingCount);
  return (
    <Box
      aria-label={`${pendingCount} pending join requests`}
      sx={{
        minWidth: 22,
        height: 22,
        px: 0.5,
        borderRadius: "999px",
        bgcolor: "warning.main",
        color: "rgba(0,0,0,0.87)",
        fontSize: "0.7rem",
        fontWeight: 800,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
      }}
    >
      {label}
    </Box>
  );
}
