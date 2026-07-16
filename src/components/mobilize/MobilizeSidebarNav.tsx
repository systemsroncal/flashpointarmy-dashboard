"use client";

import {
  MOBILIZE_GROUP_TAB_LABELS,
  canViewMobilizeGroupReports,
  mobilizeGroupDetailHref,
  mobilizeGroupTabsForNav,
  parseMobilizeGroupTab,
  type MobilizeGroupTabSlug,
} from "@/lib/mobilize/group-detail-tabs";
import { isMobilizeChapterMine } from "@/lib/mobilize/mobilize-chapter-membership";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import {
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { mobilizeNavTourAttr } from "@/lib/dashboard/dashboard-tour-steps";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { flashpointYellow } from "@/theme/tokens";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import MapIcon from "@mui/icons-material/Map";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { MobilizeNavNotificationsBadge } from "@/components/mobilize/MobilizeNavNotificationsBadge";

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

const MOBILIZE_DASHBOARD_NAV_ITEM_SX = {
  borderTop: "1px solid rgba(255,215,0,0.14)",
  mt: 0.5,
  pt: 0.5,
} as const;

const TAB_ICONS: Record<MobilizeGroupTabSlug, ReactNode> = {
  announcements: <CampaignOutlinedIcon sx={{ fontSize: 18 }} />,
  events: <EventAvailableOutlinedIcon sx={{ fontSize: 18 }} />,
  members: <GroupsOutlinedIcon sx={{ fontSize: 18 }} />,
  resources: <FolderOpenOutlinedIcon sx={{ fontSize: 18 }} />,
  updates: <NotificationsActiveOutlinedIcon sx={{ fontSize: 18 }} />,
  reports: <AssessmentOutlinedIcon sx={{ fontSize: 18 }} />,
};

type MyGroupRow = {
  id: string;
  name: string;
  created_by?: string;
  parent_group_id?: string | null;
  membership?: { member_role: string; membership_status: string };
};

type ActiveGroupPayload = {
  id: string;
  name: string;
  parent_group_id: string | null;
  created_by?: string;
  membership: { member_role: string; membership_status: string } | null;
  canViewReports: boolean;
  isMine: boolean;
  isSubgroup: boolean;
};

type Props = {
  onNavigate?: () => void;
  showSettings: boolean;
};

function ChapterTabLinks({
  groupId,
  activeTab,
  canViewReports,
  onNavigate,
  indent = 3,
}: {
  groupId: string;
  activeTab: MobilizeGroupTabSlug;
  canViewReports: boolean;
  onNavigate?: () => void;
  indent?: number;
}) {
  const slugs = mobilizeGroupTabsForNav(canViewReports);
  return (
    <List dense disablePadding sx={{ pl: indent }}>
      {slugs.map((slug) => {
        const selected = activeTab === slug;
        return (
          <ListItem key={slug} disablePadding>
            <ListItemButton
              component={Link}
              href={mobilizeGroupDetailHref(groupId, slug)}
              selected={selected}
              onClick={onNavigate}
              sx={{
                ...NAV_ITEM_TOUCH_SX,
                py: 0.45,
                minHeight: 40,
                borderRadius: 1,
                mx: 0.5,
                "&.Mui-selected": {
                  bgcolor: "rgba(255, 215, 0, 0.14)",
                  "& .MuiListItemIcon-root": { color: flashpointYellow },
                  "& .MuiListItemText-primary": { color: flashpointYellow, fontWeight: 700 },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30, color: selected ? flashpointYellow : "rgba(255,255,255,0.65)" }}>
                {TAB_ICONS[slug]}
              </ListItemIcon>
              <ListItemText
                primary={MOBILIZE_GROUP_TAB_LABELS[slug]}
                primaryTypographyProps={{
                  variant: "body2",
                  fontSize: "0.78rem",
                  fontWeight: selected ? 700 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export function MobilizeSidebarNav({ onNavigate, showSettings }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const me = useDashboardUser();
  const activeTab = parseMobilizeGroupTab(searchParams.get("tab"));

  const activeGroupId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/mobilize\/groups\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const [myGroups, setMyGroups] = useState<MyGroupRow[]>([]);
  const [activeGroup, setActiveGroup] = useState<ActiveGroupPayload | null>(null);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [myGroupsOpen, setMyGroupsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mobilize/my-groups");
        const json = (await res.json()) as { groups?: MyGroupRow[] };
        if (!cancelled && res.ok) {
          setMyGroups((json.groups ?? []).map((g) => ({ ...g, id: g.id, name: g.name })));
        }
      } catch {
        if (!cancelled) setMyGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/groups/${activeGroupId}`);
        const json = (await res.json()) as {
          group?: { id: string; name: string; created_by?: string; parent_group_id?: string | null };
          membership?: { member_role: string; membership_status: string } | null;
        };
        if (cancelled || !res.ok || !json.group) {
          if (!cancelled) setActiveGroup(null);
          return;
        }
        const membership = json.membership ?? null;
        const parentGroupId = json.group.parent_group_id ?? null;
        const isSubgroup = parentGroupId != null;
        const canViewReports = canViewMobilizeGroupReports({
          isSuperAdmin: me.role_names.includes("super_admin"),
          isAdmin: me.role_names.includes("admin"),
          groupCreatedBy: json.group.created_by,
          currentUserId: me.id,
          membership,
        });
        const isMine = isMobilizeChapterMine({
          membership,
          groupCreatedBy: json.group.created_by,
          currentUserId: me.id,
        });
        setActiveGroup({
          id: json.group.id,
          name: json.group.name,
          parent_group_id: parentGroupId,
          created_by: json.group.created_by,
          membership,
          canViewReports,
          isMine,
          isSubgroup,
        });
      } catch {
        if (!cancelled) setActiveGroup(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeGroupId, me.id, me.role_names]);

  const onChaptersPage = pathname === MOBILIZE_CHAPTERS_HREF || pathname === `${MOBILIZE_PREFIX}/`;
  const onHomePage = pathname === MOBILIZE_HOME_HREF || pathname === MOBILIZE_PREFIX;
  const onProfilePage = pathname.startsWith(`${MOBILIZE_PREFIX}/profile/`);
  const onOwnProfilePage = onProfilePage && pathname === mobilizeMemberProfileHref(me.id);
  const onSocialHub = onHomePage || onOwnProfilePage;
  const myProfileHref = mobilizeMemberProfileHref(me.id);
  const onMyGroupsPage = pathname === MOBILIZE_MY_GROUPS_HREF;
  const onActivitiesPage = pathname.startsWith(`${MOBILIZE_PREFIX}/activities`);
  const onNotificationsPage = pathname.startsWith(`${MOBILIZE_PREFIX}/notifications`);
  const onSettingsPage = pathname.startsWith(`${MOBILIZE_PREFIX}/settings`);

  const showBrowseChapterUnderChapters = Boolean(
    activeGroup && !activeGroup.isSubgroup && !activeGroup.isMine
  );
  const showMyGroupsTree = Boolean(activeGroup?.isSubgroup || myGroups.length > 0);

  useEffect(() => {
    if (showBrowseChapterUnderChapters) setChaptersOpen(true);
  }, [showBrowseChapterUnderChapters, activeGroupId]);

  useEffect(() => {
    if (activeGroup?.isSubgroup) setMyGroupsOpen(true);
  }, [activeGroup?.isSubgroup, activeGroupId]);

  const sidebarMyGroups = useMemo(() => {
    const rows = myGroups.slice(0, MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT);
    if (activeGroup?.isSubgroup && !rows.some((r) => r.id === activeGroup.id)) {
      return [{ id: activeGroup.id, name: activeGroup.name }, ...rows].slice(
        0,
        MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT
      );
    }
    return rows;
  }, [myGroups, activeGroup]);

  const toggleChapters = useCallback(() => setChaptersOpen((v) => !v), []);
  const toggleMyGroups = useCallback(() => setMyGroupsOpen((v) => !v), []);

  const chaptersSelected =
    onChaptersPage ||
    (Boolean(activeGroupId) && activeGroup !== null && !activeGroup.isSubgroup && !activeGroup.isMine);
  const myGroupsSelected =
    onMyGroupsPage || (Boolean(activeGroupId) && activeGroup !== null && activeGroup.isSubgroup);

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={onSocialHub ? MOBILIZE_CHAPTERS_HREF : "/dashboard"}
          data-tour={mobilizeNavTourAttr(onSocialHub ? MOBILIZE_CHAPTERS_HREF : "/dashboard")}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            px: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            ...MOBILIZE_DASHBOARD_NAV_ITEM_SX,
          }}
        >
          <ListItemIcon sx={{ color: "rgba(255,255,255,0.92)", minWidth: 28 }}>
            {onSocialHub ? <MapIcon sx={{ fontSize: 18 }} /> : <ArrowBackIcon sx={{ fontSize: 18 }} />}
          </ListItemIcon>
          <ListItemText
            primary={onSocialHub ? "Chapters" : "Dashboard"}
            primaryTypographyProps={{
              variant: "overline",
              fontWeight: 700,
              fontSize: "0.68rem",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.2,
            }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={myProfileHref}
          selected={onOwnProfilePage}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: onOwnProfilePage ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <PersonOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: onOwnProfilePage ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={MOBILIZE_CHAPTERS_HREF}
          selected={chaptersSelected && !showBrowseChapterUnderChapters}
          data-tour={mobilizeNavTourAttr(MOBILIZE_CHAPTERS_HREF)}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: chaptersSelected ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <MapIcon />
          </ListItemIcon>
          <ListItemText
            primary="Chapters"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: chaptersSelected ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {showBrowseChapterUnderChapters ? (
            <Box
              component="span"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleChapters();
              }}
              sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.72)", p: 0.5 }}
            >
              {chaptersOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          ) : null}
        </ListItemButton>
      </ListItem>
      <Collapse in={showBrowseChapterUnderChapters && chaptersOpen} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 1.5, pb: 0.5 }}>
          {activeGroup && !activeGroup.isSubgroup ? (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href={`/dashboard/mobilize/groups/${activeGroup.id}/groups`}
                selected={activeGroupId === activeGroup.id}
                onClick={onNavigate}
                sx={{
                  py: 0.35,
                  minHeight: 36,
                  borderRadius: 1,
                  mx: 0.5,
                  "&.Mui-selected .MuiListItemText-primary": {
                    color: flashpointYellow,
                    fontWeight: 700,
                  },
                }}
              >
                <ListItemText
                  primary={activeGroup.name}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontSize: "0.8rem",
                    fontWeight: activeGroupId === activeGroup.id ? 700 : 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) : null}
        </List>
      </Collapse>

      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={MOBILIZE_MY_GROUPS_HREF}
          selected={myGroupsSelected && !myGroupsOpen}
          data-tour={mobilizeNavTourAttr(MOBILIZE_MY_GROUPS_HREF)}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: myGroupsSelected ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <Groups2OutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Groups"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: myGroupsSelected ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {showMyGroupsTree ? (
            <Box
              component="span"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMyGroups();
              }}
              sx={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.72)", p: 0.5 }}
            >
              {myGroupsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          ) : null}
        </ListItemButton>
      </ListItem>
      <Collapse in={showMyGroupsTree && myGroupsOpen} timeout="auto" unmountOnExit>
        <List dense disablePadding sx={{ pl: 1.5, pb: 0.5 }}>
          {sidebarMyGroups.map((group) => {
            const isActiveGroup = activeGroupId === group.id && Boolean(activeGroup?.isSubgroup);
            const groupReports = isActiveGroup && activeGroup ? activeGroup.canViewReports : false;
            return (
              <Box key={group.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={mobilizeGroupDetailHref(group.id)}
                    selected={isActiveGroup}
                    onClick={onNavigate}
                    sx={{
                      py: 0.35,
                      minHeight: 36,
                      borderRadius: 1,
                      mx: 0.5,
                      "&.Mui-selected .MuiListItemText-primary": {
                        color: flashpointYellow,
                        fontWeight: 700,
                      },
                    }}
                  >
                    <ListItemText
                      primary={group.name}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontSize: "0.8rem",
                        fontWeight: isActiveGroup ? 700 : 600,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
                {isActiveGroup && activeGroup ? (
                  <ChapterTabLinks
                    groupId={group.id}
                    activeTab={activeTab}
                    canViewReports={groupReports}
                    onNavigate={onNavigate}
                  />
                ) : null}
              </Box>
            );
          })}
          {myGroups.length > MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT ? (
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                href={MOBILIZE_MY_GROUPS_HREF}
                onClick={onNavigate}
                sx={{ py: 0.35, minHeight: 36, borderRadius: 1, mx: 0.5 }}
              >
                <ListItemText
                  primary="View all"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "primary.main",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ) : null}
        </List>
      </Collapse>

      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={`${MOBILIZE_PREFIX}/activities`}
          selected={onActivitiesPage}
          data-tour={mobilizeNavTourAttr(`${MOBILIZE_PREFIX}/activities`)}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: onActivitiesPage ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <EventAvailableOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Upcoming Activities"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: onActivitiesPage ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={`${MOBILIZE_PREFIX}/notifications`}
          selected={onNotificationsPage}
          data-tour={mobilizeNavTourAttr(`${MOBILIZE_PREFIX}/notifications`)}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: onNotificationsPage ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <NotificationsActiveOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Notifications"
            sx={{ flex: "1 1 auto", minWidth: 0, m: 0 }}
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: onNotificationsPage ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          <MobilizeNavNotificationsBadge />
        </ListItemButton>
      </ListItem>

      {showSettings ? (
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href={`${MOBILIZE_PREFIX}/settings`}
            selected={onSettingsPage}
            data-tour={mobilizeNavTourAttr(`${MOBILIZE_PREFIX}/settings`)}
            onClick={onNavigate}
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
          </ListItemButton>
        </ListItem>
      ) : null}
    </>
  );
}
