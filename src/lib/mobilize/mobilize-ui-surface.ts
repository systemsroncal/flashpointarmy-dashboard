import type { SxProps, Theme } from "@mui/material";

/** White content panel — inset on dark Mobilize page, not full-bleed. */
export const mobilizePanelSx: SxProps<Theme> = {
  bgcolor: "#ffffff",
  color: "#0d0d0d",
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.1)",
  p: { xs: 2, sm: 2.5 },
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  width: "100%",
  boxSizing: "border-box",
};

/** Chapter detail: page column fills viewport below dashboard chrome. */
export const mobilizeChapterDetailRootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100dvh - 5.5rem - env(safe-area-inset-bottom, 0px))",
};

/** White panel grows to consume remaining chapter detail height. */
export const mobilizeChapterDetailPanelFillSx: SxProps<Theme> = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

/** Active tab body inside the white panel — stretches with the panel. */
export const mobilizeGroupTabPanelSx: SxProps<Theme> = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

export const mobilizeCardSx: SxProps<Theme> = {
  bgcolor: "#fafafa",
  borderColor: "rgba(0,0,0,0.1)",
  color: "#0d0d0d",
};

export const mobilizeTableContainerSx: SxProps<Theme> = {
  borderRadius: 1,
  border: "1px solid rgba(0,0,0,0.12)",
  bgcolor: "#ffffff",
};

export const mobilizeGoldBorder = "rgba(202, 154, 0, 0.35)";

export const mobilizeCalendarDaySx = (inMonth: boolean) =>
  ({
    bgcolor: inMonth ? "#f3f4f6" : "#fafafa",
    borderColor: inMonth ? mobilizeGoldBorder : "transparent",
  }) as const;
