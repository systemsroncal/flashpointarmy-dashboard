"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional right rail (trends, suggestions) for home feed */
  rightRail?: ReactNode;
  /** Optional left rail (about, members) for profile pages */
  leftRail?: ReactNode;
};

const feedColumnSx = {
  maxWidth: 680,
  mx: "auto",
  width: "100%",
} as const;

export function MobilizeSocialFeedShell({ children, rightRail, leftRail }: Props) {
  if (leftRail || rightRail) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: leftRail && rightRail ? "280px minmax(0, 1fr) 300px" : leftRail ? "280px minmax(0, 1fr)" : "minmax(0, 1fr) 300px",
          },
          gap: { xs: 2, lg: 2.5 },
          alignItems: "start",
        }}
      >
        {leftRail ? <Box sx={{ display: { xs: "none", lg: "block" } }}>{leftRail}</Box> : null}
        <Box sx={feedColumnSx}>{children}</Box>
        {rightRail ? <Box sx={{ display: { xs: "none", lg: "block" } }}>{rightRail}</Box> : null}
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f0f2f5", borderRadius: 2, p: { xs: 1, sm: 1.5 }, minHeight: 200 }}>
      <Box sx={feedColumnSx}>{children}</Box>
    </Box>
  );
}
