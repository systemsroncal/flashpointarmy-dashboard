"use client";

import { mobilizePanelTheme } from "@/theme/mobilize-content-theme";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import { ThemeProvider } from "@mui/material/styles";

/**
 * Modal dialogs in Mobilize use the light panel theme (dark text on white paper).
 *
 * `disableEnforceFocus` is required because these dialogs host the TinyMCE editor,
 * whose own popups (emoji picker, link dialog) are portaled to <body>. With the focus
 * trap on, MUI pulls focus back and their search inputs cannot be typed into.
 */
export function MobilizeDialog(props: DialogProps) {
  return (
    <ThemeProvider theme={mobilizePanelTheme}>
      <Dialog disableEnforceFocus {...props} />
    </ThemeProvider>
  );
}
