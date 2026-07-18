"use client";

import { mobilizeGroupFeedCardSx } from "@/lib/mobilize/mobilize-ui-surface";
import { flashpointYellow } from "@/theme/tokens";
import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  variant?: "default" | "groupFeed";
};

function SidebarCardTitle({ title, variant }: { title: string; variant: "default" | "groupFeed" }) {
  if (variant === "groupFeed") {
    return (
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: "-0.01em", mb: 0.75 }}>
          {title}
        </Typography>
        <Box sx={{ width: 52, height: 3, bgcolor: flashpointYellow, borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.25, letterSpacing: "-0.01em" }}>
      {title}
    </Typography>
  );
}

export function MobilizeProfileSidebarCard({ title, children, variant = "default" }: Props) {
  const isGroupFeed = variant === "groupFeed";

  return (
    <Paper
      elevation={0}
      sx={{
        ...(isGroupFeed ? mobilizeGroupFeedCardSx : {}),
        p: 2,
        borderRadius: isGroupFeed ? 2.5 : 2,
        border: isGroupFeed ? undefined : "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        color: "#0d0d0d",
        mb: 2,
        boxShadow: isGroupFeed ? undefined : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <SidebarCardTitle title={title} variant={variant} />
      {children}
    </Paper>
  );
}

export function MobilizeRecommendationsCard({
  title,
  children,
  sticky = true,
  variant = "default",
}: {
  title?: string;
  children: ReactNode;
  sticky?: boolean;
  variant?: "default" | "groupFeed";
}) {
  const heading = title?.trim();
  const isGroupFeed = variant === "groupFeed";

  return (
    <Paper
      elevation={0}
      sx={{
        ...(isGroupFeed ? mobilizeGroupFeedCardSx : {}),
        p: 2,
        borderRadius: isGroupFeed ? 2.5 : 2.5,
        border: isGroupFeed ? undefined : "1px solid rgba(0,0,0,0.08)",
        bgcolor: "#fff",
        color: "#0d0d0d",
        position: sticky ? "sticky" : "static",
        top: sticky ? 16 : undefined,
        boxShadow: isGroupFeed ? undefined : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {heading ? (
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
          {heading}
        </Typography>
      ) : null}
      <Box>{children}</Box>
    </Paper>
  );
}
