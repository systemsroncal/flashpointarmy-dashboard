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

/** White padded content area on the dark Mobilize page background. */
export function MobilizeContentPanel({ children, sx, fill }: Props) {
  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Box sx={[mobilizePanelSx, fill ? mobilizeChapterDetailPanelFillSx : null, sx] as SxProps<Theme>}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
