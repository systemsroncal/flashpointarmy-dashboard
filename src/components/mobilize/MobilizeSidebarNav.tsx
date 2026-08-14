"use client";

import { canViewMobilizeGroupReports, mobilizeGroupDetailHref } from "@/lib/mobilize/group-detail-tabs";
import { isMobilizeChapterMine } from "@/lib/mobilize/mobilize-chapter-membership";
import {
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizeNavTourAttr } from "@/lib/dashboard/dashboard-tour-steps";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { flashpointYellow } from "@/theme/tokens";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MapIcon from "@mui/icons-material/Map";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
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
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const GROUP_NAME_ACTIVE_SX = {
  bgcolor: flashpointYellow,
  "&:hover": { bgcolor: flashpointYellow },
  "& .MuiListItemText-primary": {
    color: "#0a0a0a",
    fontWeight: 700,
    lineHeight: 1.15,
  },
} as const;

function SidebarGroupNameLink({
  name,
  href,
  isActive,
  onNavigate,
}: {
  name: string;
  href: string;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={href}
        onClick={onNavigate}
        sx={{
          py: 0.35,
          minHeight: 36,
          borderRadius: 1,
          mx: 0.5,
          maxWidth: 155,
          ...(isActive ? GROUP_NAME_ACTIVE_SX : {}),
        }}
      >
        <ListItemText
          primary={name}
          sx={{ m: 0, minWidth: 0, overflow: "hidden" }}
          primaryTypographyProps={{
            variant: "body2",
            fontSize: "0.8rem",
            fontWeight: isActive ? 700 : 600,
            lineHeight: isActive ? 1.15 : undefined,
            color: isActive ? "#0a0a0a" : undefined,
            noWrap: true,
            title: name,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

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

export function MobilizeSidebarNav({ onNavigate, showSettings }: Props) {
  const pathname = usePathname();
  const me = useDashboardUser();

  const activeGroupId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/mobilize\/groups\/([^/]+)/);
    return match?.[1] ?? null;
  }, [pathname]);

  const [myGroups, setMyGroups] = useState<MyGroupRow[]>([]);
  const [activeGroup, setActiveGroup] = useState<ActiveGroupPayload | null>(null);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [myGroupsOpen, setMyGroupsOpen] = useState(false);

  const canSeeNotifications = useMemo(() => {
    if (
      me.role_names.includes("super_admin") ||
      me.role_names.includes("admin") ||
      me.role_names.includes("sub_admin")
    ) {
      return true;
    }
    return myGroups.some((g) => g.created_by === me.id);
  }, [me.id, me.role_names, myGroups]);

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

  const topNavHref = "/dashboard";
  const topNavLabel = "Main Dashboard";
  const topNavIcon = <ArrowBackIcon sx={{ fontSize: 18 }} />;

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={topNavHref}
          data-tour={mobilizeNavTourAttr(topNavHref)}
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
          <ListItemIcon sx={{ color: "rgba(255,255,255,0.92)", minWidth: 28 }}>{topNavIcon}</ListItemIcon>
          <ListItemText
            primary={topNavLabel}
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
          href={MOBILIZE_HOME_HREF}
          selected={pathname === MOBILIZE_HOME_HREF}
          data-tour={mobilizeNavTourAttr(MOBILIZE_HOME_HREF)}
          onClick={onNavigate}
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: pathname === MOBILIZE_HOME_HREF ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <HomeOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Home"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: pathname === MOBILIZE_HOME_HREF ? "primary.main" : "rgba(255,255,255,0.88)",
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
            primary="Find Chapters"
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
            <SidebarGroupNameLink
              name={activeGroup.name}
              href={`/dashboard/mobilize/groups/${activeGroup.id}/groups`}
              isActive={activeGroupId === activeGroup.id}
              onNavigate={onNavigate}
            />
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
            primary="My Groups"
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
            return (
              <Box key={group.id}>
                <SidebarGroupNameLink
                  name={group.name}
                  href={mobilizeGroupDetailHref(group.id)}
                  isActive={isActiveGroup}
                  onNavigate={onNavigate}
                />
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

      {canSeeNotifications ? (
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
      ) : null}

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
