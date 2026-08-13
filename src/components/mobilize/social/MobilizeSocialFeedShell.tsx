"use client";

import { mobilizeGroupFeedPostsColumnSx } from "@/lib/mobilize/mobilize-ui-surface";
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
  /** Group profile three-column layout on dark background. */
  variant?: "default" | "groupProfile";
};

export function MobilizeSocialFeedShell({
  children,
  rightRail,
  leftRail,
  fill = false,
  variant = "default",
}: Props) {
  const isGroupProfile = variant === "groupProfile";
  const fillSx = fill || isGroupProfile ? { flex: 1, minHeight: 0, height: "100%", display: "flex", flexDirection: "column" as const } : {};
  const threeColumn = Boolean(leftRail && rightRail);
  const twoColumn = Boolean(leftRail && !rightRail);
  const feedColumnSx = {
    maxWidth: isGroupProfile || twoColumn || threeColumn ? 685 : 680,
    mx: threeColumn || (isGroupProfile && leftRail) || twoColumn ? 0 : "auto",
    width: "100%",
  } as const;

  const gridColumns = isGroupProfile
    ? leftRail && rightRail
      ? {
          xs: "1fr",
          lg: "minmax(240px, 300px) minmax(0, 685px) minmax(220px, 280px)",
        }
      : leftRail
        ? {
            xs: "1fr",
            lg: "minmax(240px, 300px) minmax(0, 685px)",
          }
        : {
            xs: "1fr",
            lg: "minmax(0, 685px)",
          }
    : {
        xs: "1fr",
        lg: threeColumn
          ? "minmax(220px, 260px) minmax(0, 1fr) minmax(240px, 300px)"
          : leftRail
            ? "minmax(220px, 260px) minmax(0, 1fr)"
            : rightRail
              ? "minmax(0, 1fr) minmax(240px, 300px)"
              : "1fr",
      };

  const body = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: gridColumns,
        gap: { xs: 2, lg: isGroupProfile ? 3 : 2.5 },
        alignItems: "start",
        ...(isGroupProfile
          ? { flex: 1, minHeight: 0, width: "100%" }
          : { minHeight: { lg: "calc(100dvh - 5.5rem - 380px)" } }),
        ...(!isGroupProfile && fill ? { flex: 1, minHeight: 0 } : {}),
      }}
    >
      {leftRail ? (
        <Box sx={{ display: { xs: "contents", lg: "block" }, order: { xs: 2, lg: 0 }, alignSelf: "start" }}>
          <Box
            sx={{
              display: { xs: "block", lg: "block" },
              position: { lg: "sticky" },
              top: { lg: 72 },
              maxHeight: { lg: "calc(100dvh - 88px)" },
              overflowY: { lg: "auto" },
            }}
          >
            {leftRail}
          </Box>
        </Box>
      ) : null}
      <Box
        sx={{
          ...feedColumnSx,
          order: { xs: 1, lg: 0 },
          ...(isGroupProfile ? mobilizeGroupFeedPostsColumnSx : { display: "flex", flexDirection: "column", minHeight: 0 }),
          ...(fill ? { flex: 1 } : {}),
        }}
      >
        {children}
      </Box>
      {rightRail ? (
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            alignSelf: "start",
            position: "sticky",
            top: 72,
            maxHeight: "calc(100dvh - 88px)",
            overflowY: "auto",
          }}
        >
          {rightRail}
        </Box>
      ) : null}
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
