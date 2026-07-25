"use client";

import { Box, List, ListItem, ListItemButton } from "@mui/material";
import Link from "next/link";

const NESTED_NAV_TOUCH_SX = {
  minHeight: 40,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
} as const;

export type SidebarNestedNavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  selected: boolean;
  tourAttr?: string;
};

type Props = {
  items: SidebarNestedNavItem[];
  onNavigate?: () => void;
};

/** Tree-style submenu (like Training) with nav icons instead of status circles. */
export function SidebarNestedNavList({ items, onNavigate }: Props) {
  return (
    <Box sx={{ pl: 2.25, pr: 1, pb: 0.5, position: "relative" }}>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: 18,
          top: 4,
          bottom: 8,
          width: 2,
          bgcolor: "#22c55e",
          borderRadius: 1,
        }}
      />
      <List disablePadding sx={{ position: "relative" }}>
        {items.map((item) => (
          <ListItem key={item.key} disablePadding sx={{ pl: 0 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={item.selected}
              onClick={onNavigate}
              data-tour={item.tourAttr}
              sx={{
                ...NESTED_NAV_TOUCH_SX,
                py: 0,
                px: 0,
                pl: "3px",
                "&.Mui-selected": { bgcolor: "rgba(255,215,0,0.06)" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.75,
                  py: 0.5,
                  pl: "3px",
                  width: "100%",
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 13,
                    borderTop: "1px dashed rgba(255,255,255,0.28)",
                    mt: 0.95,
                    flexShrink: 0,
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    flexShrink: 0,
                    mt: 0.15,
                    width: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.selected ? "primary.main" : "rgba(255,255,255,0.92)",
                    "& svg": { fontSize: 16 },
                  }}
                >
                  {item.icon}
                </Box>
                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    color: item.selected ? "primary.main" : "#fff",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    lineHeight: 1.35,
                    pt: 0.1,
                  }}
                >
                  {item.label}
                </Box>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
