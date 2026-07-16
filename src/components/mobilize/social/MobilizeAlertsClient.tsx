"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { ALERTS_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import { SOCIAL_HUB_TEXT_MUTED } from "@/lib/mobilize/social/social-hub-surface";
import type { SocialAlert } from "@/lib/mobilize/social/load-social-alerts";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Avatar, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function MobilizeAlertsClient() {
  const [alerts, setAlerts] = useState<SocialAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/social/alerts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load alerts.");
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
    <Box sx={mobilizeChapterDetailRootSx}>
      <MobilizeSocialHubLayout>
        <MobilizeSocialHubContent tone="light">
          <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Alerts
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: SOCIAL_HUB_TEXT_MUTED }}>
            Likes, new followers, and reactions on your posts — separate from chapter group notifications.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !alerts.length ? (
            <MobilizeSectionEmptyState fill title={ALERTS_EMPTY.title} description={ALERTS_EMPTY.description} />
          ) : (
            <Stack spacing={1}>
              {alerts.map((a) => (
                <Paper
                  key={a.id}
                  elevation={0}
                  sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={a.actor.avatar_url ?? undefined} sx={{ width: 40, height: 40 }}>
                      {a.actor.display_name.slice(0, 1)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {a.href ? (
                        <Typography component={Link} href={a.href} fontWeight={700} sx={{ color: "inherit", textDecoration: "none" }}>
                          {a.actor.display_name}
                        </Typography>
                      ) : (
                        <Typography fontWeight={700}>{a.actor.display_name}</Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {a.summary} · {new Date(a.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>
    </Box>
  );
}
