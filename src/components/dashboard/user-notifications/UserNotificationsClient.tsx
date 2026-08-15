"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { SOCIAL_HUB_LIGHT_BG } from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import {
  AlertAvatar,
  formatAlertTime,
} from "@/components/dashboard/user-notifications/social-alert-ui";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function UserNotificationsClient() {
  const [alerts, setAlerts] = useState<SocialAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user-notifications?limit=60");
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
  }, [load]);

  async function removeAlert(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      const res = await fetch("/api/user-notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId }),
      });
      if (!res.ok) void load();
    } catch {
      void load();
    }
  }

  return (
    // Same light chrome as the Mobilize group profile: gray container, white cards.
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={{
          bgcolor: SOCIAL_HUB_LIGHT_BG,
          color: "text.primary",
          borderRadius: { xs: 0, sm: 2 },
          border: { xs: "none", sm: "1px solid rgba(0,0,0,0.06)" },
          p: { xs: 1.5, sm: 2, md: 2.5 },
          boxSizing: "border-box",
          width: "100%",
          flex: 1,
        }}
      >
        <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.75, letterSpacing: "-0.02em" }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Follows, likes, comments on your posts, and updates from people you follow.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !alerts.length ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: "1rem",
                border: "1px solid rgba(0,0,0,0.08)",
                bgcolor: "#fff",
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 34, color: "rgba(0,0,0,0.3)" }} />
                <Typography sx={{ color: "rgba(0,0,0,0.6)" }}>No notifications yet.</Typography>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {alerts.map((a) => (
                <Paper
                  key={a.id}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.08)",
                    bgcolor: "#fff",
                    transition: "background-color 0.15s ease, border-color 0.15s ease",
                    "&:hover": a.href
                      ? { bgcolor: "#f7f8fa", borderColor: "rgba(0,0,0,0.16)" }
                      : undefined,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    {a.href ? (
                      <Box
                        component={Link}
                        href={a.href}
                        sx={{ textDecoration: "none", color: "inherit", display: "block", flexShrink: 0 }}
                      >
                        <AlertAvatar alert={a} size={44} />
                      </Box>
                    ) : (
                      <Box sx={{ flexShrink: 0 }}>
                        <AlertAvatar alert={a} size={44} />
                      </Box>
                    )}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {a.href ? (
                        <Typography
                          component={Link}
                          href={a.href}
                          sx={{
                            color: "#0d0d0d",
                            lineHeight: 1.4,
                            textDecoration: "none",
                            display: "block",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {a.actor.display_name}
                          </Box>{" "}
                          {a.summary}
                        </Typography>
                      ) : (
                        <Typography sx={{ color: "#0d0d0d", lineHeight: 1.4 }}>
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {a.actor.display_name}
                          </Box>{" "}
                          {a.summary}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(0,0,0,0.6)" }}
                        title={new Date(a.created_at).toLocaleString()}
                      >
                        {formatAlertTime(a.created_at)} · {new Date(a.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => void removeAlert(a.id)}
                        aria-label="Delete notification"
                        sx={{
                          color: "#b91c1c",
                          opacity: 0.7,
                          "&:hover": { opacity: 1, bgcolor: "rgba(185,28,28,0.08)" },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
