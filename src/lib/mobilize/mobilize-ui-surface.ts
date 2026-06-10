import type { SxProps, Theme } from "@mui/material";

/** White content panel (e.g. group tabs area). */
export const mobilizePanelSx: SxProps<Theme> = {
  bgcolor: "#ffffff",
  color: "text.primary",
  borderRadius: 2,
  border: "1px solid rgba(0,0,0,0.1)",
  p: { xs: 2, sm: 2.5 },
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
};

export const mobilizeCardSx: SxProps<Theme> = {
  bgcolor: "background.paper",
  borderColor: "rgba(0,0,0,0.1)",
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
