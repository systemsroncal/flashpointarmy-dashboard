"use client";

import { MobilizeBottomNav } from "@/components/mobilize/MobilizeBottomNav";
import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";
import { parseMobilizeGroupDetailId } from "@/lib/mobilize/group-detail-tabs";
import { isMobilizeSocialHubPath } from "@/lib/mobilize/mobilize-chapters-nav-config";
import {
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizePageTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const MOBILIZE_PROFILE_PATH_RE = /^\/dashboard\/mobilize\/profile\/[^/]+\/?$/;

/** Routes where the sticky mobile footer nav is intentionally hidden. */
function hideMobilizeBottomNav(pathname: string): boolean {
  if (pathname === MOBILIZE_HOME_HREF || pathname.startsWith(`${MOBILIZE_HOME_HREF}/`)) return true;
  if (pathname === MOBILIZE_BOOKMARKS_HREF || pathname.startsWith(`${MOBILIZE_BOOKMARKS_HREF}/`)) {
    return true;
  }
  if (MOBILIZE_PROFILE_PATH_RE.test(pathname)) return true;
  return false;
}

function MobilizeBottomNavHost() {
  const pathname = usePathname();
  const groupId = parseMobilizeGroupDetailId(pathname);
  const isMobilizeRoute = pathname.startsWith(MOBILIZE_PREFIX);

  if (!isMobilizeRoute || groupId || hideMobilizeBottomNav(pathname)) return null;

  if (isMobilizeSocialHubPath(pathname) || MOBILIZE_PROFILE_PATH_RE.test(pathname)) {
    return <MobilizeBottomNav variant="social" />;
  }

  return <MobilizeBottomNav variant="chapters" />;
}

export function MobilizeContentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const groupId = parseMobilizeGroupDetailId(pathname);
  const showBottomNav =
    pathname.startsWith(MOBILIZE_PREFIX) && !groupId && !hideMobilizeBottomNav(pathname);

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
