"use client";

import {
  TRUTH_HUB_BORDER,
  TRUTH_HUB_TEXT,
  TRUTH_HUB_TEXT_MUTED,
} from "@/lib/mobilize/social/social-hub-surface";
import { Box, Typography } from "@mui/material";

export type MobilizeContentTab = { id: string; label: string };

type Props = {
  tabs: MobilizeContentTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Truth Social–style pink accent underline. */
  variant?: "truth" | "facebook";
  /** Dark Truth center column vs white panel. */
  surface?: "light" | "dark";
};

const TRUTH_ACCENT = "#ff2952";
const FACEBOOK_ACCENT = "#1877f2";

export function MobilizeContentTabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = "truth",
  surface = "light",
}: Props) {
  const accent = variant === "truth" ? TRUTH_ACCENT : FACEBOOK_ACCENT;
  const isDark = surface === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        bgcolor: isDark ? "transparent" : "#fff",
        borderBottom: isDark ? `1px solid ${TRUTH_HUB_BORDER}` : "1px solid rgba(0,0,0,0.08)",
        overflowX: "auto",
        flexShrink: 0,
        position: isDark ? "sticky" : undefined,
        top: isDark ? 57 : undefined,
        zIndex: isDark ? 2 : undefined,
      }}
    >
      {tabs.map((t) => {
        const selected = activeTab === t.id;
        return (
          <Box
            key={t.id}
            component="button"
            type="button"
            onClick={() => onTabChange(t.id)}
            sx={{
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              px: { xs: 2, sm: 2.5 },
              py: 1.35,
              fontWeight: selected ? 800 : 600,
              color: selected
                ? isDark
                  ? TRUTH_HUB_TEXT
                  : accent
                : isDark
                  ? TRUTH_HUB_TEXT_MUTED
                  : "text.secondary",
              borderBottom: "3px solid",
              borderBottomColor: selected ? accent : "transparent",
              whiteSpace: "nowrap",
              fontSize: "0.95rem",
              flexShrink: 0,
              transition: "color 0.15s ease, border-color 0.15s ease",
              "&:hover": {
                color: selected ? (isDark ? TRUTH_HUB_TEXT : accent) : isDark ? TRUTH_HUB_TEXT : "text.primary",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              },
            }}
          >
            <Typography component="span" variant="body2" fontWeight="inherit" sx={{ fontSize: "inherit" }}>
              {t.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
