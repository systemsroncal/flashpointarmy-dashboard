"use client";

import { MobilizeSocialHubRightRail } from "@/components/mobilize/social/MobilizeSocialHubRightRail";
import type { HubSidebarPayload } from "@/lib/mobilize/social/load-hub-sidebar";
import { SOCIAL_HUB_LIGHT_BG } from "@/lib/mobilize/social/social-hub-surface";
import { Box } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  sidebar?: HubSidebarPayload | null;
  /** @deprecated Internal social nav removed; left dashboard sidebar is the primary nav. */
  showInternalNav?: boolean;
  /** Hide right recommendations rail (e.g. dense tools). */
  showRightRail?: boolean;
  /** Member profile on mobile: no outer card chrome (full-bleed under the slim app bar). */
  flushOnMobile?: boolean;
};

export function MobilizeSocialHubLayout({
  children,
  sidebar = null,
  showRightRail = false,
  flushOnMobile = false,
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        flex: { xs: "0 0 auto", lg: 1 },
        minHeight: { xs: "auto", lg: 0 },
        bgcolor: SOCIAL_HUB_LIGHT_BG,
        borderRadius: flushOnMobile ? { xs: 0, sm: 2 } : 2,
        overflow: { xs: "visible", lg: "hidden" },
        border: flushOnMobile
          ? { xs: "none", sm: "1px solid rgba(0,0,0,0.06)" }
          : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", minHeight: 0 }}>{children}</Box>
      {showRightRail ? <MobilizeSocialHubRightRail initial={sidebar} /> : null}
    </Box>
  );
}
