import type { SxProps, Theme } from "@mui/material";

/** Fixed bottom tab bar height (px) on mobile Mobilize routes. */
export const MOBILIZE_BOTTOM_NAV_HEIGHT_PX = 56;

/** Viewport height below dashboard main padding (toolbar offset + bottom padding). */
export const mobilizePageViewportHeight =
  "calc(100dvh - 5.5rem - env(safe-area-inset-bottom, 0px))";

/** Mobile chapter detail: reserve space for fixed bottom tab bar. */
export const mobilizePageViewportHeightMobileBottomNav = `calc(100dvh - 5.5rem - ${MOBILIZE_BOTTOM_NAV_HEIGHT_PX}px - env(safe-area-inset-bottom, 0px))`;

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

/** Page column fills and is capped to the viewport below dashboard chrome. */
export const mobilizeChapterDetailRootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  height: {
    xs: mobilizePageViewportHeightMobileBottomNav,
    lg: mobilizePageViewportHeight,
  },
  maxHeight: {
    xs: mobilizePageViewportHeightMobileBottomNav,
    lg: mobilizePageViewportHeight,
  },
  minHeight: 0,
  overflow: "hidden",
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

/** Tab body when the profile header scrolls with page content (group detail). */
export const mobilizeGroupTabPanelScrollSx: SxProps<Theme> = {
  width: "100%",
};

/** Group profile feed content area (below cover header). */
export const mobilizeGroupFeedContentBg = "#080808";

export const mobilizeGroupFeedCardSx: SxProps<Theme> = {
  bgcolor: "#fff",
  color: "#0d0d0d",
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

/** White panel for non-feed group tabs on the dark content background. */
export const mobilizeGroupSecondaryTabPanelSx: SxProps<Theme> = {
  width: "100%",
  boxSizing: "border-box",
  p: { xs: 2, sm: 2.5 },
  bgcolor: "#fff",
  color: "#0d0d0d",
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

/** Dark group feed content strip — grows to fill viewport when tab content is sparse. */
export const mobilizeGroupFeedContentFillSx: SxProps<Theme> = {
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
