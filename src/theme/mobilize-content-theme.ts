"use client";

import { createTheme } from "@mui/material/styles";
import { flashpointTheme } from "@/theme/flashpoint-theme";
import { flashpointBlack, flashpointYellow } from "@/theme/tokens";

/** Dark page chrome for `/dashboard/mobilize/*` (matches dashboard main area). */
export const mobilizePageTheme = createTheme(flashpointTheme, {
  components: {
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: flashpointYellow,
          height: 3,
        },
      },
    },
  },
});

/** Light theme scoped to white content panels only. */
export const mobilizePanelTheme = createTheme(flashpointTheme, {
  palette: {
    mode: "light",
    primary: {
      main: flashpointYellow,
      dark: "#c9a600",
      contrastText: flashpointBlack,
    },
    background: {
      default: "#ffffff",
      paper: "#fafafa",
    },
    text: {
      primary: flashpointBlack,
      secondary: "rgba(0,0,0,0.65)",
    },
    divider: "rgba(0,0,0,0.12)",
    warning: {
      main: "#b45309",
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "rgba(0,0,0,0.65)",
          fontWeight: 700,
        },
      },
    },
  },
});
