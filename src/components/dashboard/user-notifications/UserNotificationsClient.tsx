"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import {
  AlertAvatar,
  formatAlertTime,
} from "@/components/dashboard/user-notifications/social-alert-ui";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  ThemeProvider,
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

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", width: "100%", p: { xs: 1.5, sm: 2 } }}>
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
      ) : (
        // Cards are white inside the dark dashboard chrome — force the light palette
        // so names, summaries and timestamps stay readable.
        <ThemeProvider theme={mobilizePanelTheme}>
          {!alerts.length ? (
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
              {alerts.map((a) => {
                const body = (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      border: "1px solid rgba(0,0,0,0.08)",
                      bgcolor: "#fff",
                      transition: "background-color 0.15s ease, border-color 0.15s ease",
                      "&:hover": a.href
                        ? { bgcolor: "rgba(0,0,0,0.02)", borderColor: "rgba(0,0,0,0.16)" }
                        : undefined,
                    }}
                  >
                    <Stack direction="row" spacing={1.75} alignItems="center">
                      <AlertAvatar alert={a} size={44} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ color: "#0d0d0d", lineHeight: 1.4 }}>
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
                          {formatAlertTime(a.created_at)} ·{" "}
                          {new Date(a.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );

                return a.href ? (
                  <Box
                    key={a.id}
                    component={Link}
                    href={a.href}
                    sx={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    {body}
                  </Box>
                ) : (
                  <Box key={a.id}>{body}</Box>
                );
              })}
            </Stack>
          )}
        </ThemeProvider>
      )}
    </Box>
  );
}
