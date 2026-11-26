"use client";

import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import {
  MobilizeNotificationsFeedContent,
} from "@/components/mobilize/MobilizeNotificationsFeed";
import { useMobilizeNotifications } from "@/components/mobilize/useMobilizeNotifications";
import {
  dashboardLightPageIntroSx,
  dashboardMobileHiddenPageTitleSx,
} from "@/lib/dashboard/dashboard-light-page-sx";
import { mobilizeMobilePageRootSx, mobilizeScrollBodySx } from "@/lib/mobilize/mobilize-ui-surface";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

export function MobilizeNotificationsClient() {
  const { data, loading, soundEnabled, toggleSound } = useMobilizeNotifications({ playSound: true });

  return (
    <Box sx={mobilizeMobilePageRootSx({ boxSizing: "border-box" })}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3, flexShrink: 0 }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <NotificationsActiveOutlinedIcon
            sx={{ fontSize: 32, color: "primary.main", display: { xs: "none", sm: "block" } }}
          />
          <Box>
            <Typography variant="h4" fontWeight={700} lineHeight={1.2} sx={dashboardMobileHiddenPageTitleSx}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={dashboardLightPageIntroSx}>
              Join requests and new chapter activity
            </Typography>
          </Box>
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(_, checked) => toggleSound(checked)}
              color="primary"
            />
          }
          label="Sound alerts"
          sx={{ m: 0 }}
        />
      </Stack>

      <MobilizeContentPanel fill sx={mobilizeScrollBodySx}>
        <MobilizeNotificationsFeedContent
          loading={loading}
          pendingJoinRequests={data.pendingJoinRequests}
          recentGroupEvents={data.recentGroupEvents}
        />
      </MobilizeContentPanel>
    </Box>
  );
}
