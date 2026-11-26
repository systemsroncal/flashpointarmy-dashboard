import { MobilizeMessagesClient } from "@/components/mobilize/social/MobilizeMessagesClient";
import {
  dashboardLightPageIntroSx,
  dashboardMobileHiddenPageTitleSx,
} from "@/lib/dashboard/dashboard-light-page-sx";
import { mobilizeMobilePageRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Box, Typography } from "@mui/material";
import { Suspense } from "react";

export default function MobilizeMessagesPage() {
  return (
    <Box sx={mobilizeMobilePageRootSx({ display: "flex", flexDirection: "column", minHeight: 0, boxSizing: "border-box" })}>
      <Typography variant="h5" fontWeight={800} sx={{ flexShrink: 0, ...dashboardMobileHiddenPageTitleSx }}>
        Messages
      </Typography>
      <Typography variant="body2" sx={dashboardLightPageIntroSx}>
        Direct messages with members you follow.
      </Typography>
      <Suspense fallback={null}>
        <MobilizeMessagesClient />
      </Suspense>
    </Box>
  );
}
