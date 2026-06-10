"use client";

import { mobilizePageTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

export function MobilizeContentShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={mobilizePageTheme}>
      <Box sx={{ minHeight: "100%" }}>{children}</Box>
    </ThemeProvider>
  );
}
