"use client";

import { MobilizeSidebarNav } from "@/components/mobilize/MobilizeSidebarNav";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { Box, List } from "@mui/material";

/** Mobilize navigation rendered inside user profile content (not the app drawer). */
export function MobilizeProfileInternalNav() {
  const me = useDashboardUser();

  return (
    <Box
      sx={{
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        width: 220,
        flexShrink: 0,
        bgcolor: "rgba(10,10,12,0.92)",
        borderRight: "1px solid rgba(255,215,0,0.12)",
        borderRadius: "12px 0 0 12px",
        overflow: "hidden",
        alignSelf: "stretch",
      }}
    >
      <List
        sx={{
          py: 1,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <MobilizeSidebarNav
          variant="profile-internal"
          showSettings={me.role_names.includes("super_admin")}
        />
      </List>
    </Box>
  );
}
