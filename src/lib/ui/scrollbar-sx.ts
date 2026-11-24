import type { SxProps, Theme } from "@mui/material";

/** Thin scrollbars for light surfaces (Mobilize feed, search). */
export const mobilizeLightScrollbarSx: SxProps<Theme> = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0,0,0,0.28) rgba(0,0,0,0.06)",
  "&::-webkit-scrollbar": { width: 8, height: 8 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 8,
    border: "2px solid transparent",
    backgroundClip: "padding-box",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 8,
  },
};

/** Thin scrollbars for dark panels (dashboard shell, search dialog). */
export const mobilizeDarkScrollbarSx: SxProps<Theme> = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(255,215,0,0.35) rgba(255,255,255,0.08)",
  "&::-webkit-scrollbar": { width: 8, height: 8 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255,215,0,0.35)",
    borderRadius: 8,
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(255,215,0,0.55)",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
  },
};