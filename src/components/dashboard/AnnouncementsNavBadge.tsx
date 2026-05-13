"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { Badge, IconButton, Tooltip } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 12_000;

export function AnnouncementsNavBadge() {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/announcements", { cache: "no-store" });
      const data = (await res.json()) as { unreadCount?: number; error?: string };
      if (res.ok && typeof data.unreadCount === "number") setUnread(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <Tooltip title="Notifications">
      <IconButton
        component={Link}
        href="/dashboard/notifications"
        color="inherit"
        size="small"
        aria-label="Notifications"
      >
        <Badge badgeContent={unread || undefined} color="primary">
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
