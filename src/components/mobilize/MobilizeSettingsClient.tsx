"use client";

import { MobilizeContentPanel } from "@/components/mobilize/MobilizeContentPanel";
import { MobilizeFeedAdsSettingsForm } from "@/components/mobilize/feed-ads/MobilizeFeedAdsSettingsForm";
import { MobilizePolicySettingsForm } from "@/components/mobilize/MobilizePolicySettingsForm";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

export function MobilizeSettingsClient() {
  const [tab, setTab] = useState<"policy" | "ads">("policy");

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v: "policy" | "ads") => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="policy" label="Policies" sx={{ textTransform: "none", fontWeight: 600 }} />
        <Tab value="ads" label="Ads" sx={{ textTransform: "none", fontWeight: 600 }} />
      </Tabs>

      <MobilizeContentPanel>
        {tab === "policy" ? <MobilizePolicySettingsForm /> : <MobilizeFeedAdsSettingsForm />}
      </MobilizeContentPanel>
    </Box>
  );
}
