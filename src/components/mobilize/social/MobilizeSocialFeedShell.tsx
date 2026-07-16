"use client";

import { Box, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";

type Props = {
  children: ReactNode;
  /** Optional right rail (trends, suggestions) for home feed */
  rightRail?: ReactNode;
  /** Optional left rail (about, members) for profile pages */
  leftRail?: ReactNode;
  /** Stretch to fill parent tab panel (group detail feed tab). */
  fill?: boolean;
};

const feedColumnSx = {
  maxWidth: 680,
  mx: "auto",
  width: "100%",
} as const;

export function MobilizeSocialFeedShell({ children, rightRail, leftRail, fill = false }: Props) {
  const fillSx = fill ? { flex: 1, minHeight: 0 } : {};
  const body = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg:
            leftRail && rightRail
              ? "minmax(240px, 280px) minmax(0, 1fr) minmax(260px, 300px)"
              : leftRail
                ? "minmax(240px, 280px) minmax(0, 1fr)"
                : "minmax(0, 1fr) minmax(260px, 300px)",
        },
        gap: { xs: 2, lg: 2.5 },
        alignItems: "stretch",
        ...fillSx,
      }}
    >
      {leftRail ? (
        <Box sx={{ display: { xs: "contents", lg: "block" }, order: { xs: 2, lg: 0 } }}>
          <Box sx={{ display: { xs: "block", lg: "block" } }}>{leftRail}</Box>
        </Box>
      ) : null}
      <Box sx={{ ...feedColumnSx, order: { xs: 1, lg: 0 }, display: "flex", flexDirection: "column", minHeight: 0, ...(fill ? { flex: 1 } : {}) }}>
        {children}
      </Box>
      {rightRail ? <Box sx={{ display: { xs: "none", lg: "block" } }}>{rightRail}</Box> : null}
    </Box>
  );

  if (leftRail || rightRail) {
    return <ThemeProvider theme={mobilizePanelTheme}><Box sx={fillSx}>{body}</Box></ThemeProvider>;
  }

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box sx={{ bgcolor: "#f0f2f5", borderRadius: 2, p: { xs: 1, sm: 1.5 }, minHeight: 200 }}>
        <Box sx={feedColumnSx}>{children}</Box>
      </Box>
    </ThemeProvider>
  );
}
