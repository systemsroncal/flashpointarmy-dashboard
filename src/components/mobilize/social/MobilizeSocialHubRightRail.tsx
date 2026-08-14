"use client";

import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import type { HubSidebarPayload } from "@/lib/mobilize/social/load-hub-sidebar";
import { SOCIAL_HUB_LIGHT_BG } from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { Box, Button, Stack, ThemeProvider, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type Props = {
  /** Optional override from parent (e.g. home feed load). */
  initial?: HubSidebarPayload | null;
};

export function MobilizeSocialHubRightRail({ initial = null }: Props) {
  const [data, setData] = useState<HubSidebarPayload | null>(initial);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mobilize/social/hub-sidebar");
      const json = (await res.json()) as HubSidebarPayload & { error?: string };
      if (res.ok) setData(json);
    } catch {
      setData({ topics: [], suggested_groups: [] });
    }
  }, []);

  useEffect(() => {
    if (!initial) void load();
    else setData(initial);
  }, [initial, load]);

  const topics = data?.topics ?? [];

  if (!topics.length) return null;

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          width: 300,
          flexShrink: 0,
          bgcolor: SOCIAL_HUB_LIGHT_BG,
          borderLeft: "1px solid rgba(0,0,0,0.08)",
          px: 1.5,
          py: 2,
          color: "#0d0d0d",
        }}
      >
        <Stack spacing={2} sx={{ position: "sticky", top: 16 }}>
          <MobilizeRecommendationsCard title="Topics">
            {topics.map((t) => (
              <Box key={t.label} sx={{ py: 1, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {t.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.post_count} recent {t.post_count === 1 ? "post" : "posts"}
                </Typography>
              </Box>
            ))}
            <Button size="small" sx={{ mt: 1, textTransform: "none" }}>
              Show more
            </Button>
          </MobilizeRecommendationsCard>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
