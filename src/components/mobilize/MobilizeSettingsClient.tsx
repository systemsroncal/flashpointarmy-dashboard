"use client";

import { MobilizeAutoFollowSettings } from "@/components/mobilize/MobilizeAutoFollowSettings";
import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import { MobilizeFeedAdsSettingsForm } from "@/components/mobilize/feed-ads/MobilizeFeedAdsSettingsForm";
import { MobilizePolicySettingsForm } from "@/components/mobilize/MobilizePolicySettingsForm";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

export function MobilizeSettingsClient() {
  const [tab, setTab] = useState<"policy" | "ads" | "auto-follow">("policy");

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v: "policy" | "ads" | "auto-follow") => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="policy" label="Policies" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab value="ads" label="Ads" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab value="auto-follow" label="Auto-follow" sx={{ textTransform: "none", fontWeight: 600 }} />
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
