"use client";

import {
  SOCIAL_HUB_LIGHT_BG,
  TRUTH_HUB_CENTER_BG,
  TRUTH_HUB_TEXT,
} from "@/lib/mobilize/social/social-hub-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { Box, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";

export type SocialHubContentTone = "truth-dark" | "light";

type Props = {
  children: ReactNode;
  tone?: SocialHubContentTone;
};

/** Applies correct text palette for hub center column (fixes light text on white panels). */
export function MobilizeSocialHubContent({ children, tone = "light" }: Props) {
  if (tone === "truth-dark") {
    return (
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          bgcolor: TRUTH_HUB_CENTER_BG,
          color: TRUTH_HUB_TEXT,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          bgcolor: SOCIAL_HUB_LIGHT_BG,
          color: "#0d0d0d",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
