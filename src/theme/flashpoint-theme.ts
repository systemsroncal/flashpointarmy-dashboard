"use client";

import { createTheme } from "@mui/material/styles";
import {
  flashpointBlack,
  flashpointCharcoal,
  flashpointYellow,
} from "@/theme/tokens";

export { flashpointYellow, flashpointBlack, flashpointCharcoal } from "@/theme/tokens";

export const flashpointTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: flashpointYellow,
      contrastText: flashpointBlack,
    },
    secondary: {
      main: "#f5f5f5",
    },
    background: {
      default: flashpointBlack,
      paper: flashpointCharcoal,
    },
    text: {
      primary: "#f5f5f5",
      secondary: "rgba(255,255,255,0.7)",
    },
  },
  typography: {
    fontFamily: "var(--font-barlow), system-ui, Helvetica, Arial, sans-serif",
    h4: { fontWeight: 700, letterSpacing: "0.04em" },
    h6: { fontWeight: 600 },
    button: { letterSpacing: "0.08em", fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: flashpointCharcoal,
          borderRight: `1px solid rgba(255, 215, 0, 0.2)`,
        },
      },
    },
  },
});
