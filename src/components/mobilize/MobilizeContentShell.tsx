"use client";

import { mobilizePageTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

/**
 * Mobilize pages share the light panel theme. The sticky mobile bottom nav was
 * removed when the main + Mobilize sidebars merged into one drawer.
 */
export function MobilizeContentShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={mobilizePageTheme}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
          minHeight: "100%",
          width: "100%",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
