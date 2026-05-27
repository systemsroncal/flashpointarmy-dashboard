"use client";

import { Box } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 12_000;

/** Unread dashboard announcements count (same source as `/dashboard/notifications`). */
export function NotificationsDrawerUnreadCount() {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/announcements", { cache: "no-store" });
      const data = (await res.json()) as { unreadCount?: number };
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

  if (unread < 1) return null;

  const label = unread > 99 ? "99+" : String(unread);
  return (
    <Box
      aria-label={`${unread} unread notifications`}
      sx={{
        minWidth: 22,
        height: 22,
        px: 0.5,
        borderRadius: "999px",
        bgcolor: "primary.main",
        color: "rgba(0,0,0,0.87)",
        fontSize: "0.7rem",
        fontWeight: 800,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        pointerEvents: "none",
      }}
    >
      {label}
    </Box>
  );
}
