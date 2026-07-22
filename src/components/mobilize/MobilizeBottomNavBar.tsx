"use client";

import { flashpointYellow } from "@/theme/tokens";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";

export type MobilizeBottomNavBarItem = {
  key: string;
  label: string;
  shortLabel?: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  active?: boolean;
};

type Props = {
  items: MobilizeBottomNavBarItem[];
  ariaLabel: string;
  borderAccent?: "gold" | "neutral";
};

function navItemButtonSx(active: boolean) {
  return {
    flex: "1 1 0",
    minWidth: 0,
    maxWidth: "none",
    flexDirection: "column" as const,
    gap: 0.25,
    borderRadius: 0,
    color: active ? flashpointYellow : "rgba(255,255,255,0.62)",
    py: 0.75,
    textDecoration: "none",
  };
}

function NavItemButton({ item }: { item: MobilizeBottomNavBarItem }) {
  const label = item.shortLabel ?? item.label;
  const active = Boolean(item.active);

  const content = (
    <>
      {item.icon}
      <Typography
        component="span"
        variant="caption"
        noWrap
        sx={{
          fontSize: "0.62rem",
          lineHeight: 1.1,
          fontWeight: active ? 700 : 500,
          maxWidth: "100%",
          px: 0.25,
        }}
      >
        {label}
      </Typography>
    </>
  );

  if (item.onClick) {
    return (
      <IconButton
        aria-label={item.label}
        onClick={item.onClick}
        sx={navItemButtonSx(active)}
      >
        {content}
      </IconButton>
    );
  }

  return (
    <IconButton
      component={Link}
      href={item.href ?? "#"}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      sx={navItemButtonSx(active)}
    >
      {content}
    </IconButton>
  );
}

/** Below 580px: up to 5 primary items + overflow. Below 400px: up to 4 primary + overflow. */
function usePrimaryNavSlotLimit(): number {
  const theme = useTheme();
  const below400 = useMediaQuery(theme.breakpoints.down(400));
  const below580 = useMediaQuery("(max-width:579px)");

  if (below400) return 4;
  if (below580) return 5;
  return Number.POSITIVE_INFINITY;
}

export function MobilizeBottomNavBar({ items, ariaLabel, borderAccent = "neutral" }: Props) {
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);
  const primaryLimit = usePrimaryNavSlotLimit();

  const { primaryItems, overflowItems, showOverflow } = useMemo(() => {
    if (items.length <= primaryLimit) {
      return { primaryItems: items, overflowItems: [] as MobilizeBottomNavBarItem[], showOverflow: false };
    }
    return {
      primaryItems: items.slice(0, primaryLimit),
      overflowItems: items.slice(primaryLimit),
      showOverflow: true,
    };
  }, [items, primaryLimit]);

  const overflowActive = overflowItems.some((item) => item.active);

  return (
    <>
      <Box
        component="nav"
        aria-label={ariaLabel}
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          height: MOBILIZE_BOTTOM_NAV_HEIGHT_PX,
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "rgba(8,8,8,0.96)",
          borderTop:
            borderAccent === "gold"
              ? "1px solid rgba(255,215,0,0.18)"
              : "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
        }}
      >
        {primaryItems.map((item) => (
          <NavItemButton key={item.key} item={item} />
        ))}
        {showOverflow ? (
          <IconButton
            aria-label="More navigation"
            aria-haspopup="menu"
            aria-expanded={Boolean(overflowAnchor) ? "true" : undefined}
            onClick={(e) => setOverflowAnchor(e.currentTarget)}
            sx={navItemButtonSx(overflowActive || Boolean(overflowAnchor))}
          >
            <MoreHorizIcon sx={{ fontSize: 22 }} />
            <Typography
              component="span"
              variant="caption"
              sx={{ fontSize: "0.62rem", lineHeight: 1.1, fontWeight: 500 }}
            >
              More
            </Typography>
          </IconButton>
        ) : null}
      </Box>

      <Menu
        anchorEl={overflowAnchor}
        open={Boolean(overflowAnchor)}
        onClose={() => setOverflowAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mb: 1,
              bgcolor: "rgba(12,12,14,0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
              minWidth: 200,
            },
          },
        }}
      >
        {overflowItems.map((item) => {
          const label = item.shortLabel ?? item.label;
          const active = Boolean(item.active);
          return (
            <MenuItem
              key={item.key}
              component={item.href ? Link : "li"}
              href={item.href}
              onClick={() => {
                item.onClick?.();
                setOverflowAnchor(null);
              }}
              selected={active}
              sx={{
                color: active ? flashpointYellow : "rgba(255,255,255,0.88)",
                py: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? flashpointYellow : "inherit" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 700 : 500 }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
