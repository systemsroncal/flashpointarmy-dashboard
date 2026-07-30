"use client";

import { Box } from "@mui/material";
import { useMissionUpdatesUnread } from "./MissionUpdatesUnreadProvider";

/** Unread Mission Updates count badge for sidebar nav. */
export function NotificationsDrawerUnreadCount() {
  const { unread, hasUnread } = useMissionUpdatesUnread();

  if (unread < 1) return null;

  const label = unread > 99 ? "99+" : String(unread);
  return (
    <Box
      aria-label={`${unread} unread mission updates`}
      sx={{
        minWidth: 22,
        height: 22,
        px: 0.5,
        borderRadius: "999px",
        bgcolor: "primary.main",
        color: "rgba(0,0,0,0.87)",
        fontSize: "0.7rem",
        fontWeight: 800,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
        ...(hasUnread
          ? {
              animation: "missionUpdatesBadgeBounce 1.15s ease-in-out infinite",
              "@keyframes missionUpdatesBadgeBounce": {
                "0%, 100%": { transform: "translateY(0) scale(1)" },
                "50%": { transform: "translateY(-2px) scale(1.08)" },
              },
            }
          : {}),
      }}
    >
      {label}
    </Box>
  );
}
