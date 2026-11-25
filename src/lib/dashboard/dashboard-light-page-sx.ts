import type { SxProps, Theme } from "@mui/material";

/**
 * Muted copy on Mobilize / light-gray dashboard shells (#f0f2f5).
 * Do not use theme `text.secondary` there — it is tuned for the dark shell.
 */
export const DASHBOARD_LIGHT_PAGE_MUTED_COLOR = "#5c5f66";

export const dashboardLightPageMutedSx: SxProps<Theme> = {
  color: DASHBOARD_LIGHT_PAGE_MUTED_COLOR,
};

/** Page h4 when DashboardShell already shows the module title on mobile. */
export const dashboardMobileHiddenPageTitleSx: SxProps<Theme> = {
  display: { xs: "none", md: "block" },
};