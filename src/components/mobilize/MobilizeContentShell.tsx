"use client";

import { mobilizeContentTheme } from "@/theme/mobilize-content-theme";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

export function MobilizeContentShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={mobilizeContentTheme}>
      <Box
        sx={{
          bgcolor: "background.default",
          color: "text.primary",
          minHeight: "100%",
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
