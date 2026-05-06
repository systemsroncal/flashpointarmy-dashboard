"use client";

import { formatNotificationDisplay } from "@/lib/notifications/format-notification";
import {
  getNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notifications/notification-sound-pref";
import { playNotificationSound } from "@/lib/notifications/play-notification-sound";
import { createClient } from "@/utils/supabase/client";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Badge,
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  Popover,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

/** Long URLs with hundreds of UUIDs in `.in()` tend to time out (504); keep chunks small. */
const IN_CHUNK_SIZE = 40;
const MAX_EVENTS = 80;
const POLL_MS = 12_000;

function chunkIds<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function NotificationMenu({ userId }: { userId: string }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = Boolean(anchor);

  useEffect(() => {
    setSoundEnabled(getNotificationSoundEnabled());
  }, []);

  useEffect(() => {
    knownIdsRef.current = null;
    setItems([]);
  }, [userId]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const runRefresh = useCallback(async () => {
    const supabase = createClient();
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: events, error: evErr } = await supabase
        .from("notification_events")
        .select("id, title, body, created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(MAX_EVENTS);
      if (evErr) return;
      const eventRows = (events ??
        []) as Array<{ id: string; title: string; body: string | null; created_at: string }>;
      const eventIds = eventRows.map((e) => e.id);
      if (!eventIds.length) {
        setItems([]);
        return;
      }
      const readByEvent = new Map<string, string | null>();
      const dismissedSet = new Set<string>();
      for (const ids of chunkIds(eventIds, IN_CHUNK_SIZE)) {
        const [{ data: reads, error: rErr }, { data: dismissed, error: dErr }] = await Promise.all([
          supabase.from("notification_reads").select("event_id, read_at").eq("user_id", userId).in("event_id", ids),
          supabase.from("notification_dismissed").select("event_id").eq("user_id", userId).in("event_id", ids),
        ]);
        if (rErr || dErr) return;
        for (const row of (reads ?? []) as Array<{ event_id: string; read_at: string | null }>) {
          readByEvent.set(row.event_id, row.read_at ?? null);
        }
        for (const row of (dismissed ?? []) as Array<{ event_id: string }>) {
          dismissedSet.add(row.event_id);
        }
      }
      const merged: NotificationRow[] = eventRows
        .filter((e) => !dismissedSet.has(e.id))
        .map((e) => ({
          id: e.id,
          title: e.title,
          body: e.body,
          read_at: readByEvent.get(e.id) ?? null,
          created_at: e.created_at,
        }));
      setItems(merged);
    } catch {
      /* Red 504 / network: keep previous items; avoid hammering Supabase */
    }
  }, [userId]);

  const requestRefresh = useCallback(
    (debounceMs: number) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (debounceMs <= 0) {
        void runRefresh();
        return;
      }
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        void runRefresh();
      }, debounceMs);
    },
    [runRefresh]
  );

  useEffect(() => {
    requestRefresh(0);
  }, [requestRefresh]);

  useEffect(() => {
    const t = setInterval(() => requestRefresh(0), POLL_MS);
    return () => clearInterval(t);
  }, [requestRefresh]);

  useEffect(() => {
    if (!open) return;
    requestRefresh(0);
  }, [open, requestRefresh]);

  useEffect(() => {
    const supabase = createClient();
    let ch: RealtimeChannel | null = null;
    try {
      ch = supabase
        .channel(`notif-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notification_events",
          },
          () => {
            requestRefresh(1200);
          }
        )
        .subscribe();
    } catch {
      /* Realtime optional */
    }
    return () => {
      if (ch) void supabase.removeChannel(ch);
    };
  }, [userId, requestRefresh]);

  useEffect(() => {
    const ids = items.map((n) => n.id);
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(ids);
      return;
    }
    let hasNew = false;
    for (const id of ids) {
      if (!knownIdsRef.current.has(id)) {
        knownIdsRef.current.add(id);
        hasNew = true;
      }
    }
    if (hasNew && soundEnabled) playNotificationSound();
  }, [items, soundEnabled]);

  const unread = items.filter((n) => !n.read_at).length;

  const setRead = async (id: string, read: boolean) => {
    const supabase = createClient();
    if (read) {
      await supabase.from("notification_reads").upsert(
        {
          user_id: userId,
          event_id: id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,event_id" }
      );
    } else {
      await supabase.from("notification_reads").delete().eq("user_id", userId).eq("event_id", id);
    }
    requestRefresh(0);
  };

  const remove = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notification_dismissed").upsert(
      {
        user_id: userId,
        event_id: id,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,event_id" }
    );
    requestRefresh(0);
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Notifications"
        size="small"
      >
        <Badge badgeContent={unread || undefined} color="primary">
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 300,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: 420,
              bgcolor: "rgba(18,18,22,0.97)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,215,0,0.12)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.06em" }}>
            Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={soundEnabled}
                onChange={(_, checked) => {
                  setSoundEnabled(checked);
                  setNotificationSoundEnabled(checked);
                }}
                inputProps={{ "aria-label": "Play sound for new notifications" }}
              />
            }
            label={
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", maxWidth: 120, lineHeight: 1.2 }}>
                Notification sound
              </Typography>
            }
            sx={{ m: 0, alignItems: "center", gap: 0.5, mr: -0.5 }}
            labelPlacement="start"
          />
        </Box>
        <Divider sx={{ borderColor: "rgba(255,215,0,0.1)" }} />
        <Box
          sx={{
            maxHeight: 360,
            overflow: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,215,0,0.2) rgba(0,0,0,0.2)",
            "&::-webkit-scrollbar": { width: 5 },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,215,0,0.2)",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.2)" },
          }}
        >
          {items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No notifications
            </Typography>
          ) : (
            items.map((n) => {
              const { title, body } = formatNotificationDisplay(n);
              const isRead = Boolean(n.read_at);
              return (
                <Box
                  key={n.id}
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    alignItems: "flex-start",
                    py: 1,
                    px: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0, pr: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isRead ? 400 : 700,
                        color: isRead ? "text.secondary" : "common.white",
                        fontSize: "0.82rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {title}
                    </Typography>
                    {body ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.35, fontSize: "0.72rem", lineHeight: 1.4 }}
                      >
                        {body}
                      </Typography>
                    ) : null}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem", opacity: 0.8 }}
                      suppressHydrationWarning
                    >
                      {new Date(n.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                    <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          void setRead(n.id, !isRead);
                        }}
                        sx={{ color: isRead ? "text.secondary" : "primary.main" }}
                        aria-label={isRead ? "Mark unread" : "Mark read"}
                      >
                        {isRead ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          void remove(n.id);
                        }}
                        sx={{ color: "error.main", opacity: 0.65, "&:hover": { opacity: 1 } }}
                        aria-label="Delete notification"
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}
