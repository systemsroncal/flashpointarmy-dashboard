"use client";

import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { Badge, IconButton, Tooltip } from "@mui/material";
import Link from "next/link";
import { MissionUpdatesNavIcon } from "./MissionUpdatesNavIcon";
import { useMissionUpdatesUnread } from "./MissionUpdatesUnreadProvider";

export function AnnouncementsNavBadge() {
  const { unread } = useMissionUpdatesUnread();

  return (
    <Tooltip title="Mission Updates">
      <IconButton
        component={Link}
        href="/dashboard/notifications"
        color="inherit"
        size="small"
        aria-label="Mission Updates"
      >
        <Badge badgeContent={unread || undefined} color="primary">
          <MissionUpdatesNavIcon>
            <CampaignOutlinedIcon />
          </MissionUpdatesNavIcon>
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
