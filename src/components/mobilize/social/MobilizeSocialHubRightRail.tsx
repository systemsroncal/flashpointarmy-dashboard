"use client";

import { MobilizeRecommendationsCard } from "@/components/mobilize/social/MobilizeProfileSidebarCard";
import type { HubSidebarPayload } from "@/lib/mobilize/social/load-hub-sidebar";
import { SOCIAL_HUB_LIGHT_BG, TRUTH_HUB_BORDER } from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CloseIcon from "@mui/icons-material/Close";
import { Avatar, Box, Button, IconButton, Stack, ThemeProvider, Typography } from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Props = {
  /** Optional override from parent (e.g. home feed load). */
  initial?: HubSidebarPayload | null;
};

export function MobilizeSocialHubRightRail({ initial = null }: Props) {
  const [data, setData] = useState<HubSidebarPayload | null>(initial);
  const [dismissedGroups, setDismissedGroups] = useState<Set<string>>(new Set());

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
  const groups = (data?.suggested_groups ?? []).filter((g) => !dismissedGroups.has(g.id));

  if (!topics.length && !groups.length) return null;

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          width: 300,
          flexShrink: 0,
          bgcolor: SOCIAL_HUB_LIGHT_BG,
          borderLeft: `1px solid ${TRUTH_HUB_BORDER}`,
          px: 1.5,
          py: 2,
          color: "#0d0d0d",
        }}
      >
        <Stack spacing={2} sx={{ position: "sticky", top: 16 }}>
        {topics.length ? (
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
        ) : null}

        {groups.length ? (
          <MobilizeRecommendationsCard title="Suggested Groups">
            {groups.map((g) => (
              <Box
                key={g.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  py: 1.25,
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <Avatar
                  src={
                    g.profile_image_url || g.cover_image_url
                      ? publicAssetSrc(g.profile_image_url || g.cover_image_url || "")
                      : undefined
                  }
                  sx={{ width: 40, height: 40 }}
                >
                  {g.name.slice(0, 1)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component={Link}
                    href={`/dashboard/mobilize/groups/${g.id}`}
                    variant="body2"
                    fontWeight={700}
                    noWrap
                    sx={{ color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                  >
                    {g.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.member_count} {g.member_count === 1 ? "member" : "members"}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Dismiss"
                  onClick={() => setDismissedGroups((prev) => new Set(prev).add(g.id))}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button component={Link} href="/dashboard/mobilize/my-groups" size="small" sx={{ mt: 1, textTransform: "none" }}>
              Show more
            </Button>
          </MobilizeRecommendationsCard>
        ) : null}
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
