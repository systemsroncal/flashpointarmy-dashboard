"use client";

import { createTheme } from "@mui/material/styles";
import { flashpointTheme } from "@/theme/flashpoint-theme";
import { flashpointBlack, flashpointYellow } from "@/theme/tokens";

/** Light surface for `/dashboard/mobilize/*` main content (sidebar stays dark). */
export const mobilizeContentTheme = createTheme(flashpointTheme, {
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
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: flashpointYellow,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(0,0,0,0.55)",
          fontWeight: 600,
          "&.Mui-selected": {
            color: flashpointBlack,
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
