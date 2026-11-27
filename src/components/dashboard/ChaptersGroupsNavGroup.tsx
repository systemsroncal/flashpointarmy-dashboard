"use client";

import { MOBILIZE_CHAPTERS_HREF } from "@/lib/mobilize/mobilize-nav-config";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEM_TOUCH_SX = {
  minHeight: 48,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  "& .MuiListItemIcon-root, & .MuiListItemText-root": {
    pointerEvents: "none",
  },
} as const;

const NAV_SELECTED_SX = {
  borderLeft: "3px solid",
  borderColor: "primary.main",
  bgcolor: "rgba(255,215,0,0.08)",
} as const;

type Props = {
  onNavigate?: () => void;
  /** When true, show the parent but disable navigation into Mobilize. */
  disabled?: boolean;
};

/** Chapters opens the chapters map directly. */
export function ChaptersGroupsNavGroup({ onNavigate, disabled = false }: Props) {
  const pathname = usePathname();
  const selected =
    pathname === MOBILIZE_CHAPTERS_HREF || pathname.startsWith(`${MOBILIZE_CHAPTERS_HREF}/`);

  if (disabled) {
    return (
      <ListItem disablePadding>
        <ListItemButton
          disabled
          aria-disabled
          data-tour="nav-chapters-groups"
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            opacity: 0.42,
            cursor: "default",
            "&.Mui-disabled": { opacity: 0.42 },
          }}
        >
          <ListItemIcon sx={{ color: "rgba(255,255,255,0.5)", minWidth: 38 }}>
            <GroupsOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Chapters"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: "rgba(255,255,255,0.45)",
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={MOBILIZE_CHAPTERS_HREF}
        onClick={onNavigate}
        selected={selected}
        data-tour="nav-chapters-groups"
        sx={{
          ...NAV_ITEM_TOUCH_SX,
          py: 0.75,
          "&.Mui-selected": NAV_SELECTED_SX,
        }}
      >
        <ListItemIcon
          sx={{
            color: selected ? "primary.main" : "rgba(255,255,255,0.92)",
            minWidth: 38,
          }}
        >
          <GroupsOutlinedIcon />
        </ListItemIcon>
        <ListItemText
          primary="Chapters"
          primaryTypographyProps={{
            variant: "body2",
            fontWeight: 600,
            fontSize: "calc(0.82rem + 3px)",
            color: selected ? "primary.main" : "rgba(255,255,255,0.88)",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}
