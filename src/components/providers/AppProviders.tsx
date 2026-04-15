"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import { flashpointTheme } from "@/theme/flashpoint-theme";
import { GlobalPageLoader } from "@/components/GlobalPageLoader";
import { NavigationProgress } from "@/components/NavigationProgress";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={flashpointTheme}>
      <CssBaseline />
      <GlobalPageLoader />
      <NavigationProgress />
      {children}
    </ThemeProvider>
  );
}
