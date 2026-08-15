"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import {
  AlertAvatar,
  formatAlertTime,
} from "@/components/dashboard/user-notifications/social-alert-ui";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PREVIEW_LIMIT = 5;
const FETCH_LIMIT = 40;
const LAST_SEEN_KEY = "fp-user-notifications-last-seen";

function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

function writeLastSeen(iso: string) {
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, iso);
  } catch {
    /* ignore */
  }
}

export function UserNotificationsMenu() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [alerts, setAlerts] = useState<SocialAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  // Frozen when the popover opens so rows stay highlighted while it is on screen.
  const [seenAtOpen, setSeenAtOpen] = useState<string | null>(null);
  const open = Boolean(anchor);

  useEffect(() => {
    setLastSeen(readLastSeen());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user-notifications?limit=${FETCH_LIMIT}`);
      const json = (await res.json()) as { alerts?: SocialAlert[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to load notifications.");
      setAlerts(json.alerts ?? []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const unreadCount = useMemo(() => {
    if (!lastSeen) return Math.min(alerts.length, 99);
    const seenAt = new Date(lastSeen).getTime();
    if (!Number.isFinite(seenAt)) return Math.min(alerts.length, 99);
    return Math.min(
      alerts.filter((a) => new Date(a.created_at).getTime() > seenAt).length,
      99
    );
  }, [alerts, lastSeen]);

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchor(e.currentTarget);
    setSeenAtOpen(lastSeen);
    const now = new Date().toISOString();
    writeLastSeen(now);
    setLastSeen(now);
    void load();
  }

  function handleClose() {
    setAnchor(null);
  }

  const preview = alerts.slice(0, PREVIEW_LIMIT);
  const seenAtOpenMs = seenAtOpen ? new Date(seenAtOpen).getTime() : null;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          size="small"
          aria-label="User notifications"
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleOpen}
        >
          <Badge badgeContent={unreadCount || undefined} color="primary">
            <NotificationsNoneOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "min(100vw - 24px, 380px)", sm: 380 },
              mt: 1,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "#fff",
              color: "#0d0d0d",
              backgroundImage: "none",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
            },
          },
        }}
      >
        {/* White surface inside the dark dashboard chrome — force the light palette. */}
        <ThemeProvider theme={mobilizePanelTheme}>
          <Box sx={{ px: 2, pt: 1.5, pb: 1.25 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", flex: 1 }}>
                Notifications
              </Typography>
              {loading && preview.length ? <CircularProgress size={14} /> : null}
            </Stack>
            <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.6)" }}>
              Follows, likes, comments, and posts from people you follow
            </Typography>
          </Box>
          <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />

          <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && !preview.length ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={22} />
              </Box>
            ) : !preview.length ? (
              <Stack alignItems="center" spacing={0.5} sx={{ py: 4, px: 2 }}>
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 30, color: "rgba(0,0,0,0.3)" }} />
                <Typography variant="body2" sx={{ color: "rgba(0,0,0,0.6)" }}>
                  No notifications yet.
                </Typography>
              </Stack>
            ) : (
              <Stack divider={<Divider flexItem sx={{ borderColor: "rgba(0,0,0,0.06)" }} />}>
                {preview.map((a) => {
                  const isUnread =
                    seenAtOpenMs === null || new Date(a.created_at).getTime() > seenAtOpenMs;
                  const content = (
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        px: 2,
                        py: 1.25,
                        bgcolor: isUnread ? "rgba(24,119,242,0.06)" : "transparent",
                        transition: "background-color 0.15s ease",
                        "&:hover": { bgcolor: isUnread ? "rgba(24,119,242,0.1)" : "rgba(0,0,0,0.04)" },
                      }}
                    >
                      <AlertAvatar alert={a} size={40} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.35, color: "#0d0d0d" }}
                        >
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {a.actor.display_name}
                          </Box>{" "}
                          {a.summary}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(0,0,0,0.6)" }}
                          title={new Date(a.created_at).toLocaleString()}
                        >
                          {formatAlertTime(a.created_at)}
                        </Typography>
                      </Box>
                      {isUnread ? (
                        <Box
                          aria-hidden
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#1877f2",
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </Stack>
                  );
                  return a.href ? (
                    <Box
                      key={a.id}
                      component={Link}
                      href={a.href}
                      onClick={handleClose}
                      sx={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      {content}
                    </Box>
                  ) : (
                    <Box key={a.id}>{content}</Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />
          <Box sx={{ p: 1.25 }}>
            <Button
              component={Link}
              href="/dashboard/user-notifications"
              fullWidth
              onClick={handleClose}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 99,
                bgcolor: "rgba(24,119,242,0.08)",
                color: "#1877f2",
                "&:hover": { bgcolor: "rgba(24,119,242,0.16)", color: "#1877f2" },
              }}
            >
              See all
            </Button>
          </Box>
        </ThemeProvider>
      </Popover>
    </>
  );
}
