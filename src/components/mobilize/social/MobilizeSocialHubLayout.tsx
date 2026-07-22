"use client";

import { MobilizeSocialHubRightRail } from "@/components/mobilize/social/MobilizeSocialHubRightRail";
import { MobilizeSocialInternalNav } from "@/components/mobilize/social/MobilizeSocialInternalNav";
import type { HubSidebarPayload } from "@/lib/mobilize/social/load-hub-sidebar";
import { TRUTH_HUB_BORDER } from "@/lib/mobilize/social/social-hub-surface";
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
        flex: { xs: "0 0 auto", lg: 1 },
        minHeight: { xs: "auto", lg: 0 },
        bgcolor: "#000",
        borderRadius: 2,
        overflow: { xs: "visible", lg: "hidden" },
        border: `1px solid ${TRUTH_HUB_BORDER}`,
      }}
    >
      <MobilizeSocialInternalNav />
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", minHeight: 0 }}>{children}</Box>
      <MobilizeSocialHubRightRail initial={sidebar} />
    </Box>
  );
}
