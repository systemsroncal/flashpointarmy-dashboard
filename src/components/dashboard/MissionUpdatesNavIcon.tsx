"use client";

import { Box } from "@mui/material";
import { useMissionUpdatesUnread } from "./MissionUpdatesUnreadProvider";

export function MissionUpdatesNavIcon({ children }: { children: React.ReactNode }) {
  const { hasUnread } = useMissionUpdatesUnread();

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...(hasUnread
          ? {
              animation: "missionUpdatesWiggle 1.15s ease-in-out infinite",
              "@keyframes missionUpdatesWiggle": {
                "0%, 100%": { transform: "rotate(0deg) scale(1)" },
                "25%": { transform: "rotate(-10deg) scale(1.1)" },
                "75%": { transform: "rotate(10deg) scale(1.1)" },
              },
            }
          : {}),
      }}
    >
      {children}
      {hasUnread ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 9,
            height: 9,
            borderRadius: "50%",
            bgcolor: "primary.main",
            boxShadow: "0 0 0 0 rgba(255,215,0,0.65)",
            animation: "missionUpdatesPing 1.35s ease-out infinite",
            "@keyframes missionUpdatesPing": {
              "0%": { boxShadow: "0 0 0 0 rgba(255,215,0,0.65)" },
              "70%": { boxShadow: "0 0 0 9px rgba(255,215,0,0)" },
              "100%": { boxShadow: "0 0 0 0 rgba(255,215,0,0)" },
            },
          }}
        />
      ) : null}
    </Box>
  );
}
