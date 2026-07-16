"use client";

import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MobilizeSocialSettingsForm } from "@/components/mobilize/social/MobilizeSocialSettingsForm";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type SettingsPayload = {
  bio: string | null;
  profile_visibility: "public" | "private";
};

export function MobilizeSocialSettingsClient() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/social/profile-settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load settings.");
      setSettings({
        bio: json.bio ?? null,
        profile_visibility: json.profile_visibility === "private" ? "private" : "public",
      });
    } catch {
      setSettings({ bio: null, profile_visibility: "public" });
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
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Settings
          </Typography>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}>
            {loading || !settings ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <MobilizeSocialSettingsForm
                initialBio={settings.bio ?? ""}
                initialVisibility={settings.profile_visibility}
                onSaved={() => void load()}
              />
            )}
          </Paper>
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>
    </Box>
  );
}
