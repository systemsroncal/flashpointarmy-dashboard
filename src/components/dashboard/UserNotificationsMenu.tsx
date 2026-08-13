"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
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
    const now = new Date().toISOString();
    writeLastSeen(now);
    setLastSeen(now);
    void load();
  }

  function handleClose() {
    setAnchor(null);
  }

  const preview = alerts.slice(0, PREVIEW_LIMIT);

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
              width: { xs: "min(100vw - 24px, 360px)", sm: 360 },
              mt: 1,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#fff",
              color: "#0d0d0d",
            },
          },
        }}
      >
        <Box sx={{ px: 1.75, py: 1.25 }}>
          <Typography fontWeight={800} sx={{ fontSize: "0.95rem" }}>
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Follows, likes, comments, and posts from people you follow
          </Typography>
        </Box>
        <Divider />

        <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
          {loading && !preview.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              Loading…
            </Typography>
          ) : !preview.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No notifications yet.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {preview.map((a) => {
                const content = (
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="flex-start"
                    sx={{
                      px: 1.75,
                      py: 1.25,
                      "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                    }}
                  >
                    <Avatar
                      src={a.actor.avatar_url ? publicAssetSrc(a.actor.avatar_url) : undefined}
                      sx={{ width: 36, height: 36 }}
                    >
                      {a.actor.display_name.slice(0, 1)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.35 }}>
                        <Box component="span" fontWeight={700}>
                          {a.actor.display_name}
                        </Box>{" "}
                        {a.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(a.created_at).toLocaleString()}
                      </Typography>
                    </Box>
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

        <Divider />
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
              bgcolor: "rgba(0,0,0,0.04)",
              color: "#0d0d0d",
              "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
            }}
          >
            See all
          </Button>
        </Box>
      </Popover>
    </>
  );
}
