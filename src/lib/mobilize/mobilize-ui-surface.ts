import type { SxProps, Theme } from "@mui/material";

/** Fixed bottom tab bar height (px) on mobile Mobilize routes. */
export const MOBILIZE_BOTTOM_NAV_HEIGHT_PX = 56;

/** Viewport height below dashboard main padding (toolbar offset + bottom padding). */
export const mobilizePageViewportHeight =
  "calc(100dvh - 5.5rem - env(safe-area-inset-bottom, 0px))";

/** Mobile chapter detail: reserve space for fixed bottom tab bar. */
export const mobilizePageViewportHeightMobileBottomNav = `calc(100dvh - 5.5rem - ${MOBILIZE_BOTTOM_NAV_HEIGHT_PX}px - env(safe-area-inset-bottom, 0px))`;

/** Horizontal gutter for Mobilize pages on small screens. */
export const mobilizeMobilePagePx: SxProps<Theme> = {
  px: { xs: 1, sm: 2, md: 3 },
};

/** White content panel — inset on dark Mobilize page, not full-bleed. */
export const mobilizePanelSx: SxProps<Theme> = {
  bgcolor: "#ffffff",
  color: "#0d0d0d",
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.1)",
  p: { xs: 1.25, sm: 2.5 },
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  width: "100%",
  boxSizing: "border-box",
};

/**
 * Page column: on mobile the page scrolls naturally; on desktop it fills and caps
 * to the viewport below dashboard chrome (internal panel scroll).
 */
export const mobilizeChapterDetailRootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  height: {
    xs: "auto",
    lg: mobilizePageViewportHeight,
  },
  maxHeight: {
    xs: "none",
    lg: mobilizePageViewportHeight,
  },
  minHeight: { xs: 0, lg: 0 },
  overflow: { xs: "visible", lg: "hidden" },
};

/** White panel grows to consume remaining chapter detail height (desktop only). */
export const mobilizeChapterDetailPanelFillSx: SxProps<Theme> = {
  flex: { xs: "0 0 auto", lg: 1 },
  display: "flex",
  flexDirection: "column",
  minHeight: { xs: "auto", lg: 0 },
  overflow: { xs: "visible", lg: "hidden" },
};

/** Flex region that fills on desktop; grows with content on mobile (page scroll). */
export const mobilizeFlexFillSx: SxProps<Theme> = {
  flex: { xs: "0 0 auto", lg: 1 },
  minHeight: { xs: "auto", lg: 0 },
  overflow: { xs: "visible", lg: "hidden" },
};

/** Scrollable body inside a fill panel — page scroll on mobile, in-panel scroll on desktop. */
export const mobilizeScrollBodySx: SxProps<Theme> = {
  flex: { xs: "0 0 auto", lg: 1 },
  minHeight: { xs: "auto", lg: 0 },
  overflow: { xs: "visible", lg: "auto" },
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
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  width: "100%",
};

/** Group profile feed content area (below cover header) — transparent; camo shows through. */
export const mobilizeGroupFeedContentBg = "transparent";

export const mobilizeGroupFeedCardSx: SxProps<Theme> = {
  bgcolor: "#fff",
  color: "#0d0d0d",
  borderRadius: 2.5,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

/** White panel for non-feed group tabs on the transparent content background. */
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
  alignSelf: "stretch",
  minHeight: {
    xs: "calc(100dvh - 18rem)",
    sm: "calc(100dvh - 22rem)",
    md: "calc(100dvh - 26rem)",
  },
};

/** Group detail page: fill main height so feed column can stretch. */
export const mobilizeGroupDetailPageRootSx: SxProps<Theme> = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  minHeight: "100%",
  width: "100%",
  overflow: "visible",
};

/** Dark strip under group hero when tabs scroll with the page. */
export const mobilizeGroupFeedContentScrollSx: SxProps<Theme> = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  width: "100%",
  minHeight: {
    xs: "calc(100dvh - 18rem)",
    sm: "calc(100dvh - 22rem)",
    md: "calc(100dvh - 26rem)",
  },
  overflow: "visible",
};

/** Transparent content strip under group hero (camo backdrop shows through). */
export const mobilizeGroupFeedContentSurfaceSx: SxProps<Theme> = {
  bgcolor: "transparent",
};

/** Center column: composer + post list — stretches with parent height. */
export const mobilizeGroupFeedPostsColumnSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  height: "100%",
};

/** Composer + posts column wrapper inside group feed. */
export const mobilizeGroupFeedPostsStackSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  height: "100%",
  gap: { xs: "15px", sm: 2 },
};

/** White Paper shell for group feed composer and posts column. */
export const mobilizeGroupFeedPaperSx: SxProps<Theme> = {
  bgcolor: "#fff",
  borderRadius: "1rem",
  boxShadow: "none",
  color: "#0d0d0d",
};

/** Growing posts list area — fills remaining height below the composer. */
export const mobilizeGroupFeedPostsListSx: SxProps<Theme> = {
  ...mobilizeGroupFeedPaperSx,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  gap: { xs: "15px", sm: 2 },
  minHeight: {
    xs: "calc(100dvh - 28rem)",
    sm: "calc(100dvh - 32rem)",
    md: "calc(100dvh - 36rem)",
  },
  border: "none",
  overflow: "visible",
  bgcolor: "transparent",
  boxShadow: "none",
};

/** Single post card in group feed (elevated white tile on camo). */
export const mobilizeGroupFeedPostCardSx: SxProps<Theme> = {
  bgcolor: "#fff",
  borderRadius: { xs: 0, sm: "1rem" },
  p: { xs: 1.25, sm: 2 },
  boxShadow: { xs: "none", sm: "0 0 9px 1px #d2d2d2" },
  m: 0,
  mb: { xs: 0, sm: 2 },
  borderBottom: { xs: "1px solid rgba(0,0,0,0.08)", sm: "none" },
  width: "100%",
  boxSizing: "border-box",
  "&:last-child": { mb: 0, borderBottom: { xs: "none", sm: "none" } },
};

/** White tab panel — fills remaining height below the group hero. */
export const mobilizeGroupSecondaryTabPanelScrollSx: SxProps<Theme> = {
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
  alignSelf: "stretch",
  minHeight: {
    xs: "calc(100dvh - 18rem)",
    sm: "calc(100dvh - 22rem)",
    md: "calc(100dvh - 26rem)",
  },
  overflow: "visible",
};

/** Content strip under group hero — fills remaining main height. */
export const mobilizeGroupFeedContentFillSx: SxProps<Theme> = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignSelf: "stretch",
  minHeight: {
    xs: "calc(100dvh - 18rem)",
    sm: "calc(100dvh - 22rem)",
    md: "calc(100dvh - 26rem)",
  },
};

/** Flex child that grows on desktop only; content-sized on mobile (page scroll). */
export const mobilizeFlexGrowDesktopOnlySx: SxProps<Theme> = {
  flex: { xs: "0 0 auto", lg: 1 },
  minHeight: { xs: "auto", lg: 0 },
};

/** Scroll region for group detail — in-panel scroll on desktop, page scroll on mobile. */
export const mobilizeGroupDetailScrollRegionSx: SxProps<Theme> = {
  flex: { xs: "0 0 auto", lg: 1 },
  minHeight: { xs: "auto", lg: 0 },
  overflowY: { xs: "visible", lg: "auto" },
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  display: "flex",
  flexDirection: "column",
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

/** Mobilize group members table — compact rows on mobile. */
export const mobilizeGroupMembersTableMobileSx: SxProps<Theme> = {
  "& .MuiTableCell-root": {
    borderBottom: "none",
  },
  "@media (max-width: 899.95px)": {
    "& .MuiTableCell-root": {
      fontSize: "12px !important",
      lineHeight: 1.1,
    },
  },
};

export const mobilizeGoldBorder = "rgba(202, 154, 0, 0.35)";

/** Pastel Join group CTA — shared across group profile, chapter groups list, public pages. */
export const mobilizeJoinGroupButtonSx: SxProps<Theme> = {
  borderRadius: 99,
  textTransform: "none",
  fontWeight: 800,
  fontSize: "calc(0.8125rem + 2px)",
  bgcolor: "#d1eeff",
  color: "#00206b",
  borderColor: "#d1eeff",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#bfe4fb",
    borderColor: "#bfe4fb",
    color: "#00206b",
    boxShadow: "none",
  },
};

export const mobilizeCalendarDaySx = (inMonth: boolean) =>
  ({
    bgcolor: inMonth ? "#f3f4f6" : "#fafafa",
    borderColor: inMonth ? mobilizeGoldBorder : "transparent",
  }) as const;
