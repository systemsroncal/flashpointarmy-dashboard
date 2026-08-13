"use client";

import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { Avatar, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
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
      ) : !alerts.length ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "1rem",
            border: "1px solid rgba(0,0,0,0.08)",
            bgcolor: "#fff",
          }}
        >
          <Typography color="text.secondary">No notifications yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {alerts.map((a) => {
            const body = (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "#fff",
                  transition: "background-color 0.15s ease",
                  "&:hover": a.href ? { bgcolor: "rgba(0,0,0,0.02)" } : undefined,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={a.actor.avatar_url ? publicAssetSrc(a.actor.avatar_url) : undefined}
                    sx={{ width: 44, height: 44 }}
                  >
                    {a.actor.display_name.slice(0, 1)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={700} noWrap>
                      {a.actor.display_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {a.summary} · {new Date(a.created_at).toLocaleString()}
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
    </Box>
  );
}
