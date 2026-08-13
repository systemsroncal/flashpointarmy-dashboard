"use client";

import { MobilizeGroupCustomNotifications } from "@/components/mobilize/MobilizeGroupCustomNotifications";
import { MobilizeNotificationsFeed } from "@/components/mobilize/MobilizeNotificationsFeed";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { Box, Stack, Typography } from "@mui/material";

type Props = {
  groupId: string;
  chapterName: string;
};

export function MobilizeChapterUpdatesPanel({ groupId, chapterName }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <NotificationsActiveOutlinedIcon sx={{ fontSize: 28, color: "primary.main" }} />
        <Box>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            Group updates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Custom notifications, join requests, and new events for {chapterName}
          </Typography>
        </Box>
      </Stack>

      <MobilizeGroupCustomNotifications groupId={groupId} />

      <MobilizeNotificationsFeed
        groupId={groupId}
        joinRequestsTitle="Pending join requests"
        eventsTitle="Recent events"
        emptyJoinMessage="No pending join requests for this group."
        emptyEventsMessage="No new upcoming events in the last 7 days."
      />
    </Box>
  );
}
