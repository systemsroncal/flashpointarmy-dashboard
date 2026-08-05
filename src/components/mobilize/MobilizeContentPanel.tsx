"use client";

import { mobilizeChapterDetailPanelFillSx, mobilizePanelSx } from "@/lib/mobilize/mobilize-ui-surface";
import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import { Box, type SxProps, type Theme } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  sx?: SxProps<Theme>;
  /** Grow to fill remaining page height below the Mobilize page header. */
  fill?: boolean;
};

/** Light content panel for Mobilize groups / public-profile modules on gray page chrome. */
export function MobilizeContentPanel({ children, sx, fill }: Props) {
  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box
        sx={
          [
            {
              ...mobilizePanelSx,
              bgcolor: "#f0f2f5",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "none",
            },
            fill ? mobilizeChapterDetailPanelFillSx : null,
            sx,
          ] as SxProps<Theme>
        }
      >
        {children}
      </Box>
    </ThemeProvider>
  );
}
