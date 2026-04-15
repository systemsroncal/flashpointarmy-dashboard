"use client";

import { Paper, Typography } from "@mui/material";

export function AccessDenied({ message }: { message: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography color="error">{message}</Typography>
    </Paper>
  );
}
