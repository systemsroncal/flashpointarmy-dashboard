"use client";

import {
  MOBILIZE_GROUP_TAB_LABELS,
  canViewMobilizeGroupReports,
  mobilizeGroupDetailHref,
  mobilizeGroupTabsForNav,
  type MobilizeGroupTabSlug,
} from "@/lib/mobilize/group-detail-tabs";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import {
  Box,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { flashpointYellow } from "@/theme/tokens";

const MOBILIZE_GROUP_TAB_ICONS: Record<MobilizeGroupTabSlug, ReactNode> = {
  announcements: <CampaignOutlinedIcon />,
  events: <EventAvailableOutlinedIcon />,
  members: <GroupsOutlinedIcon />,
  resources: <FolderOpenOutlinedIcon />,
  updates: <NotificationsActiveOutlinedIcon />,
  reports: <AssessmentOutlinedIcon />,
};

const NAV_ITEM_TOUCH_SX = {
  minHeight: 44,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  "& .MuiListItemIcon-root, & .MuiListItemText-root": {
    pointerEvents: "none",
  },
} as const;

const MOBILIZE_GROUP_TAB_NAV_SX = {
  ...NAV_ITEM_TOUCH_SX,
  py: 0.6,
  minHeight: 44,
  mx: 0.75,
  mb: 0.35,
  borderRadius: 1,
  borderLeft: "none !important",
  "&.Mui-selected": {
    bgcolor: "rgba(255, 215, 0, 0.16)",
    boxShadow: "inset 0 0 0 1px rgba(255, 215, 0, 0.35)",
    "& .MuiListItemIcon-root": { color: flashpointYellow },
    "& .MuiListItemText-primary": { color: flashpointYellow, fontWeight: 700 },
  },
  "&:hover": {
    bgcolor: "rgba(255, 255, 255, 0.06)",
  },
} as const;

type Props = {
  groupId: string;
  activeTab: MobilizeGroupTabSlug;
  onNavigate?: () => void;
};

export function MobilizeGroupSidebarTabs({ groupId, activeTab, onNavigate }: Props) {
  const me = useDashboardUser();
  const [canViewReports, setCanViewReports] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/groups/${groupId}`);
        const json = (await res.json()) as {
          group?: { created_by?: string };
          membership?: { member_role: string; membership_status: string } | null;
        };
        if (cancelled || !res.ok) return;
        setCanViewReports(
          canViewMobilizeGroupReports({
            isSuperAdmin: me.role_names.includes("super_admin"),
            isAdmin: me.role_names.includes("admin"),
            groupCreatedBy: json.group?.created_by,
            currentUserId: me.id,
            membership: json.membership ?? null,
          })
        );
      } catch {
        if (!cancelled) setCanViewReports(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, me.id, me.role_names]);

  const slugs = mobilizeGroupTabsForNav(canViewReports);

  return (
    <Box sx={{ pb: 0.75 }}>
      {slugs.map((slug) => {
        const selected = activeTab === slug;
        const href = mobilizeGroupDetailHref(groupId, slug);
        return (
          <ListItem key={slug} disablePadding>
            <ListItemButton
              component={Link}
              href={href}
              selected={selected}
              data-tour={`mobilize-group-tab-${slug}`}
              onClick={onNavigate}
              sx={{
                ...MOBILIZE_GROUP_TAB_NAV_SX,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <ListItemIcon
                sx={{
                  color: selected ? flashpointYellow : "rgba(255,255,255,0.78)",
                  minWidth: 34,
                }}
              >
                {MOBILIZE_GROUP_TAB_ICONS[slug]}
              </ListItemIcon>
              <ListItemText
                primary={MOBILIZE_GROUP_TAB_LABELS[slug]}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: selected ? 700 : 600,
                  fontSize: "calc(0.8rem + 2px)",
                  color: selected ? flashpointYellow : "rgba(255,255,255,0.86)",
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
      {canViewReports ? (
        <Divider sx={{ borderColor: "rgba(255,215,0,0.14)", mx: 1, mt: 0.5 }} />
      ) : null}
    </Box>
  );
}
