"use client";

import {
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_MY_GROUPS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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

function NavRow({
  label,
  href,
  icon,
  selected,
  disabled,
  tour,
  onNavigate,
}: {
  label: string;
  href?: string;
  icon: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  tour?: string;
  onNavigate?: () => void;
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        {...(disabled || !href
          ? { disabled: true, "aria-disabled": true }
          : { component: Link, href, onClick: onNavigate, selected })}
        data-tour={tour}
        sx={{
          ...NAV_ITEM_TOUCH_SX,
          py: 0.75,
          ...(disabled
            ? { opacity: 0.42, cursor: "default", "&.Mui-disabled": { opacity: 0.42 } }
            : { "&.Mui-selected": NAV_SELECTED_SX }),
        }}
      >
        <ListItemIcon
          sx={{
            color: disabled
              ? "rgba(255,255,255,0.5)"
              : selected
                ? "primary.main"
                : "rgba(255,255,255,0.92)",
            minWidth: 38,
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            variant: "body2",
            fontWeight: 600,
            fontSize: "calc(0.82rem + 3px)",
            color: disabled
              ? "rgba(255,255,255,0.45)"
              : selected
                ? "primary.main"
                : "rgba(255,255,255,0.88)",
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

/** Chapters opens the map. My Groups sits directly under it. */
export function ChaptersGroupsNavGroup({ onNavigate, disabled = false }: Props) {
  const pathname = usePathname();
  const chaptersSelected =
    pathname === MOBILIZE_CHAPTERS_HREF || pathname.startsWith(`${MOBILIZE_CHAPTERS_HREF}/`);
  const myGroupsSelected =
    pathname === MOBILIZE_MY_GROUPS_HREF || pathname.startsWith(`${MOBILIZE_MY_GROUPS_HREF}/`);

  return (
    <>
      <NavRow
        label="Chapters"
        href={disabled ? undefined : MOBILIZE_CHAPTERS_HREF}
        icon={<GroupsOutlinedIcon />}
        selected={chaptersSelected}
        disabled={disabled}
        tour="nav-chapters-groups"
        onNavigate={onNavigate}
      />
      <NavRow
        label="My Groups"
        href={disabled ? undefined : MOBILIZE_MY_GROUPS_HREF}
        icon={<Groups2OutlinedIcon />}
        selected={myGroupsSelected}
        disabled={disabled}
        onNavigate={onNavigate}
      />
    </>
  );
}
