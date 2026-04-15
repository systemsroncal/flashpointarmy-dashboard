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

const POLL_MS = 3500;

export function NotificationMenu({ userId }: { userId: string }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const open = Boolean(anchor);

  useEffect(() => {
    setSoundEnabled(getNotificationSoundEnabled());
  }, []);

  useEffect(() => {
    knownIdsRef.current = null;
    setItems([]);
  }, [userId]);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);
    setItems((data as NotificationRow[]) ?? []);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

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
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void refresh();
          }
        )
        .subscribe();
    } catch {
      /* Realtime optional */
    }
    return () => {
      if (ch) void supabase.removeChannel(ch);
    };
  }, [userId, refresh]);

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
    await supabase
      .from("notifications")
      .update({ read_at: read ? new Date().toISOString() : null })
      .eq("id", id);
    void refresh();
  };

  const remove = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    void refresh();
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", opacity: 0.8 }}>
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
