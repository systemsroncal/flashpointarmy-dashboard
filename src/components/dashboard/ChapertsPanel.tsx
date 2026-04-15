"use client";

import { Box, Link, Paper, Typography } from "@mui/material";
import NextLink from "next/link";

export function ChapertsPanel({ allowed }: { allowed: boolean }) {
  if (!allowed) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">You do not have access to Chaperts.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
        Chaperts
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Subsection under <strong>Locations</strong>. Use this area for chapters / cells for
        FlashPOINT operations (wire to your own tables as needed).
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "rgba(255,215,0,0.06)" }}>
        <Typography variant="body2">
          Back to{" "}
          <Link component={NextLink} href="/dashboard/locations" color="primary">
            Locations
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
