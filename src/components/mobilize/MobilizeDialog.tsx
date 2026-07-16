"use client";

import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import { ThemeProvider } from "@mui/material/styles";

/** Modal dialogs in Mobilize use the light panel theme (dark text on white paper). */
export function MobilizeDialog(props: DialogProps) {
  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Dialog {...props} />
    </ThemeProvider>
  );
}
