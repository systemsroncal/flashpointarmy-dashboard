"use client";

import { MobilizeSocialHubRightRail } from "@/components/mobilize/social/MobilizeSocialHubRightRail";
import { MobilizeSocialInternalNav } from "@/components/mobilize/social/MobilizeSocialInternalNav";
import type { HubSidebarPayload } from "@/lib/mobilize/social/load-hub-sidebar";
import { Box } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  sidebar?: HubSidebarPayload | null;
};

export function MobilizeSocialHubLayout({ children, sidebar = null }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        flex: 1,
        minHeight: 0,
        bgcolor: "#f0f2f5",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <MobilizeSocialInternalNav />
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {children}
      </Box>
      <MobilizeSocialHubRightRail initial={sidebar} />
    </Box>
  );
}
