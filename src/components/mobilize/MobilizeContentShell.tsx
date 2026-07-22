"use client";

import { MobilizeBottomNav } from "@/components/mobilize/MobilizeBottomNav";
import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";
import {
  parseMobilizeGroupDetailId,
  parseMobilizeGroupTab,
} from "@/lib/mobilize/group-detail-tabs";
import { MOBILIZE_PREFIX } from "@/lib/mobilize/mobilize-nav-config";
import { mobilizePageTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const MOBILIZE_PROFILE_PATH_RE = /^\/dashboard\/mobilize\/profile\/[^/]+\/?$/;

function MobilizeBottomNavHost() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groupId = parseMobilizeGroupDetailId(pathname);
  const isProfile = MOBILIZE_PROFILE_PATH_RE.test(pathname);
  const isMobilizeRoute = pathname.startsWith(MOBILIZE_PREFIX);

  if (!isMobilizeRoute) return null;

  if (groupId) {
    const activeTab = parseMobilizeGroupTab(searchParams.get("tab"));
    return <MobilizeBottomNav variant="group" groupId={groupId} activeTab={activeTab} />;
  }

  if (isProfile) {
    return <MobilizeBottomNav variant="social" />;
  }

  return <MobilizeBottomNav variant="social" />;
}

export function MobilizeContentShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={mobilizePageTheme}>
      <Box
        sx={{
          minHeight: "100%",
          pb: {
            xs: `calc(${MOBILIZE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`,
            lg: 0,
          },
        }}
      >
        {children}
        <MobilizeBottomNavHost />
      </Box>
    </ThemeProvider>
  );
}
