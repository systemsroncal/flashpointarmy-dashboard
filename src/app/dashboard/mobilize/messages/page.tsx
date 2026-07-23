import { MobilizeMessagesClient } from "@/components/mobilize/social/MobilizeMessagesClient";
import { Box, Typography } from "@mui/material";
import { Suspense } from "react";

export default function MobilizeMessagesPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5, flexShrink: 0 }}>
        Messages
      </Typography>
      <Suspense fallback={null}>
        <MobilizeMessagesClient />
      </Suspense>
    </Box>
  );
}
