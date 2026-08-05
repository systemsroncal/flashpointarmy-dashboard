"use client";

import { MobilizeBottomNav } from "@/components/mobilize/MobilizeBottomNav";
import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";
import { parseMobilizeGroupDetailId } from "@/lib/mobilize/group-detail-tabs";
import { isMobilizeSocialHubPath } from "@/lib/mobilize/mobilize-chapters-nav-config";
import { MOBILIZE_PREFIX } from "@/lib/mobilize/mobilize-nav-config";
import { mobilizePageTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const MOBILIZE_PROFILE_PATH_RE = /^\/dashboard\/mobilize\/profile\/[^/]+\/?$/;

function MobilizeBottomNavHost() {
  const pathname = usePathname();
  const groupId = parseMobilizeGroupDetailId(pathname);
  const isMobilizeRoute = pathname.startsWith(MOBILIZE_PREFIX);

  if (!isMobilizeRoute || groupId) return null;

  if (isMobilizeSocialHubPath(pathname) || MOBILIZE_PROFILE_PATH_RE.test(pathname)) {
    return <MobilizeBottomNav variant="social" />;
  }

  return <MobilizeBottomNav variant="chapters" />;
}

export function MobilizeContentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const groupId = parseMobilizeGroupDetailId(pathname);
  const showBottomNav = pathname.startsWith(MOBILIZE_PREFIX) && !groupId;

  return (
    <ThemeProvider theme={mobilizePageTheme}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
          minHeight: "100%",
          width: "100%",
          pb: showBottomNav
            ? {
                xs: `calc(${MOBILIZE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`,
                lg: 0,
              }
            : 0,
        }}
      >
        {children}
        <MobilizeBottomNavHost />
      </Box>
    </ThemeProvider>
  );
}
