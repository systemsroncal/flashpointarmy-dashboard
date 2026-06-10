"use client";

import { mobilizePanelSx } from "@/lib/mobilize/mobilize-ui-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { Box, type SxProps, type Theme } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

/** White padded content area on the dark Mobilize page background. */
export function MobilizeContentPanel({ children, sx }: Props) {
  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box sx={[mobilizePanelSx, sx] as SxProps<Theme>}>{children}</Box>
    </ThemeProvider>
  );
}
