"use client";

import { MOBILIZE_ADMIN_SETTINGS_HREF } from "@/lib/mobilize/mobilize-nav-config";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { Collapse, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarNestedNavList } from "@/components/dashboard/SidebarNestedNavList";

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

const TABS = [
  {
    key: "policy",
    label: "Policies",
    href: `${MOBILIZE_ADMIN_SETTINGS_HREF}?tab=policy`,
    icon: <PolicyOutlinedIcon />,
  },
  {
    key: "ads",
    label: "Ads",
    href: `${MOBILIZE_ADMIN_SETTINGS_HREF}?tab=ads`,
    icon: <ImageOutlinedIcon />,
  },
  {
    key: "auto-follow",
    label: "Auto-follow",
    href: `${MOBILIZE_ADMIN_SETTINGS_HREF}?tab=auto-follow`,
    icon: <PersonAddAlt1OutlinedIcon />,
  },
] as const;

type Props = {
  onNavigate?: () => void;
};

/** Super-admin Mobilize settings, nested under the main sidebar (below Settings). */
export function MobilizeSettingsNavGroup({ onNavigate }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const onSettingsPage = pathname.startsWith(MOBILIZE_ADMIN_SETTINGS_HREF);
  const activeTab = searchParams.get("tab") || "policy";

  useEffect(() => {
    if (onSettingsPage) setOpen(true);
  }, [onSettingsPage]);

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setOpen((prev) => !prev)}
          selected={onSettingsPage}
          data-tour="nav-mobilize-settings"
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: onSettingsPage ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Mobilize settings"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: onSettingsPage ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <SidebarNestedNavList
          items={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            href: t.href,
            icon: t.icon,
            selected: onSettingsPage && activeTab === t.key,
            tourAttr: `nav-mobilize-settings-${t.key}`,
          }))}
          onNavigate={onNavigate}
        />
      </Collapse>
    </>
  );
}
