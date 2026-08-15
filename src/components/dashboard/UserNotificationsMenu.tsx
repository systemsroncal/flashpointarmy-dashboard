"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import {
  AlertAvatar,
  formatAlertTime,
} from "@/components/dashboard/user-notifications/social-alert-ui";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Link as MuiLink,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PREVIEW_LIMIT = 40;
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

  async function removeAlert(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      const res = await fetch("/api/user-notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (!res.ok) {
        void load();
      }
    } catch {
      void load();
    }
  }

  const preview = alerts.slice(0, PREVIEW_LIMIT);
  const seenAtOpenMs = seenAtOpen ? new Date(seenAtOpen).getTime() : null;

  return (
    <>
      <Tooltip title="Profile notifications">
        <IconButton
          color="inherit"
          size="small"
          aria-label="Profile notifications"
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
              width: 300,
              maxWidth: "calc(100vw - 24px)",
              maxHeight: 420,
              bgcolor: "#fff",
              color: "#0d0d0d",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            },
          },
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(0,0,0,0.6)", letterSpacing: "0.06em" }}>
            Notifications
          </Typography>
          {loading && preview.length ? (
            <CircularProgress size={12} sx={{ color: "rgba(0,0,0,0.45)" }} />
          ) : null}
        </Box>
        <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />
        <Box
          sx={{
            maxHeight: 320,
            overflow: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.25) rgba(0,0,0,0.06)",
            "&::-webkit-scrollbar": { width: 5 },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0,0,0,0.25)",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.06)" },
          }}
        >
          {loading && !preview.length ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={20} sx={{ color: "rgba(0,0,0,0.45)" }} />
            </Box>
          ) : !preview.length ? (
            <Typography variant="body2" sx={{ p: 2, color: "rgba(0,0,0,0.6)" }}>
              No notifications
            </Typography>
          ) : (
            preview.map((a) => {
              const isUnread =
                seenAtOpenMs === null || new Date(a.created_at).getTime() > seenAtOpenMs;
              return (
                <Box
                  key={a.id}
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    alignItems: "flex-start",
                    py: 1,
                    px: 1,
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": a.href ? { bgcolor: "rgba(0,0,0,0.03)" } : undefined,
                  }}
                >
                  <Box sx={{ pt: 0.25, flexShrink: 0 }}>
                    <AlertAvatar alert={a} size={32} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pr: 0.5 }}>
                    {a.href ? (
                      <MuiLink
                        component={Link}
                        href={a.href}
                        onClick={handleClose}
                        underline="hover"
                        sx={{
                          display: "block",
                          textDecoration: "none",
                          color: "inherit",
                          "&:hover": { color: "inherit" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isUnread ? 700 : 400,
                            color: isUnread ? "#0d0d0d" : "rgba(0,0,0,0.62)",
                            fontSize: "0.82rem",
                            lineHeight: 1.35,
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {a.actor.display_name}
                          </Box>{" "}
                          {a.summary}
                        </Typography>
                      </MuiLink>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isUnread ? 700 : 400,
                          color: isUnread ? "#0d0d0d" : "rgba(0,0,0,0.62)",
                          fontSize: "0.82rem",
                          lineHeight: 1.35,
                        }}
                      >
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          {a.actor.display_name}
                        </Box>{" "}
                        {a.summary}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(0,0,0,0.55)",
                        fontSize: "0.65rem",
                        display: "block",
                        mt: 0.25,
                      }}
                      title={new Date(a.created_at).toLocaleString()}
                      suppressHydrationWarning
                    >
                      {formatAlertTime(a.created_at)} · {new Date(a.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeAlert(a.id);
                      }}
                      sx={{
                        color: "#b91c1c",
                        opacity: 0.7,
                        "&:hover": { opacity: 1, bgcolor: "rgba(185,28,28,0.08)" },
                        mt: -0.25,
                      }}
                      aria-label="Delete notification"
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })
          )}
        </Box>
        <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />
        <Box sx={{ px: 1.5, py: 1 }}>
          <MuiLink
            component={Link}
            href="/dashboard/user-notifications"
            onClick={handleClose}
            underline="hover"
            sx={{
              display: "block",
              textAlign: "center",
              typography: "caption",
              color: "rgba(0,0,0,0.62)",
              letterSpacing: "0.04em",
              "&:hover": { color: "#0d0d0d" },
            }}
          >
            See all
          </MuiLink>
        </Box>
      </Popover>
    </>
  );
}
