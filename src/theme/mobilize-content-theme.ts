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
      main: flashpointBlack,
      dark: "#000000",
      light: "rgba(0,0,0,0.55)",
      contrastText: "#ffffff",
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
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: flashpointBlack,
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#000000",
          },
        },
        outlinedPrimary: {
          borderColor: flashpointBlack,
          color: flashpointBlack,
          "&:hover": {
            backgroundColor: flashpointBlack,
            borderColor: flashpointBlack,
            color: "#ffffff",
          },
        },
        textPrimary: {
          color: flashpointBlack,
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.06)",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          color: flashpointBlack,
          borderColor: "rgba(0,0,0,0.22)",
          "&.Mui-selected": {
            backgroundColor: flashpointBlack,
            color: "#ffffff",
            borderColor: flashpointBlack,
            "&:hover": {
              backgroundColor: "#000000",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.06)",
          },
        },
      },
    },
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
