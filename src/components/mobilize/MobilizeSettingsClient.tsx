"use client";

import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import { MobilizeAutoFollowSettings } from "@/components/mobilize/MobilizeAutoFollowSettings";
import { MobilizeFeedAdsSettingsForm } from "@/components/mobilize/feed-ads/MobilizeFeedAdsSettingsForm";
import { MobilizePolicySettingsForm } from "@/components/mobilize/MobilizePolicySettingsForm";
import { Box, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type SettingsTab = "policy" | "ads" | "auto-follow";

function parseTab(raw: string | null): SettingsTab {
  if (raw === "ads" || raw === "auto-follow" || raw === "policy") return raw;
  return "policy";
}

export function MobilizeSettingsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = useMemo(() => parseTab(searchParams.get("tab")), [searchParams]);

  const setTab = useCallback(
    (next: SettingsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v: SettingsTab) => setTab(v)}
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            color: "#111",
            opacity: 1,
          },
          "& .MuiTab-root.Mui-selected": { color: "#111" },
        }}
      >
        <Tab value="policy" label="Policies" />
        <Tab value="ads" label="Ads" />
        <Tab value="auto-follow" label="Auto-follow" />
      </Tabs>

      <MobilizeContentPanel>
        {tab === "policy" ? (
          <MobilizePolicySettingsForm />
        ) : tab === "ads" ? (
          <MobilizeFeedAdsSettingsForm />
        ) : (
          <MobilizeAutoFollowSettings />
        )}
      </MobilizeContentPanel>
    </Box>
  );
}
