import type { SxProps, Theme } from "@mui/material";

/**
 * Muted copy on Mobilize / light-gray dashboard shells (#f0f2f5).
 * Do not use theme `text.secondary` there — it is tuned for the dark shell.
 */
export const DASHBOARD_LIGHT_PAGE_MUTED_COLOR = "#5c5f66";

export const dashboardLightPageMutedSx: SxProps<Theme> = {
  color: DASHBOARD_LIGHT_PAGE_MUTED_COLOR,
};

/** Module intro line — same gutter as siblings when page root uses `mobilizeMobilePagePx`. */
export const dashboardLightPageIntroSx: SxProps<Theme> = {
  ...dashboardLightPageMutedSx,
  mb: 2,
  flexShrink: 0,
  lineHeight: 1.55,
};

/** Page h4 when DashboardShell already shows the module title on mobile. */
export const dashboardMobileHiddenPageTitleSx: SxProps<Theme> = {
  display: { xs: "none", md: "block" },
};

/** Non-Mobilize module pages — consistent horizontal padding with Mobilize gutters. */
export const dashboardModulePageGutterSx: SxProps<Theme> = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  px: { xs: 0.5, sm: 0 },
};

/** Primary toolbar action (Add new, etc.) on dashboard modules. */
export const dashboardModulePrimaryButtonSx: SxProps<Theme> = {
  minHeight: { xs: 42, sm: 40 },
  px: { xs: 2.25, sm: 2.5 },
  py: { xs: 0.85, sm: 0.65 },
  fontWeight: 700,
  fontSize: "0.875rem",
  textTransform: "none",
  borderRadius: 1.25,
};