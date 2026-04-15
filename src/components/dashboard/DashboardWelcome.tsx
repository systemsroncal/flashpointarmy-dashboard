"use client";

import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { Box, Paper, Typography } from "@mui/material";

export function DashboardWelcome() {
  const { email, display_name } = useDashboardUser();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: "primary.main" }}>
        Welcome
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        FlashPOINT operations dashboard. Use the sidebar for Locations, Chaperts, system logs,
        and role administration.
      </Typography>
      <Paper sx={{ p: 2, mt: 2, bgcolor: "rgba(255,215,0,0.06)" }}>
        <Typography variant="subtitle2" color="text.secondary">
          Signed in as
        </Typography>
        {display_name ? (
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {display_name}
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {email}
        </Typography>
      </Paper>
    </Box>
  );
}
