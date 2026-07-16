"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function MobilizeProfileSidebarCard({ title, children }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        mb: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, letterSpacing: "-0.01em" }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export function MobilizeRecommendationsCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        position: "sticky",
        top: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box>{children}</Box>
    </Paper>
  );
}
