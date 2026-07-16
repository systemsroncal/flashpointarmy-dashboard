"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import { Box, Typography } from "@mui/material";

export default function MobilizeBookmarksPage() {
  return (
    <Box sx={mobilizeChapterDetailRootSx}>
      <MobilizeSocialHubLayout>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Bookmarks
          </Typography>
          <MobilizeSectionEmptyState
            fill
            title="No bookmarks yet"
            description="Saved posts and groups will appear here when bookmarking is enabled."
          />
        </Box>
      </MobilizeSocialHubLayout>
    </Box>
  );
}
