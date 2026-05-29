"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CampaignIcon from "@mui/icons-material/Campaign";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventIcon from "@mui/icons-material/Event";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import MapIcon from "@mui/icons-material/Map";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardTourHelpButton, DashboardTourProvider } from "@/components/dashboard/DashboardTour";
import { mobilizeNavTourAttr } from "@/lib/dashboard/dashboard-tour-steps";
import { DASHBOARD_DRAWER_LOGO } from "@/config/login";
import { MODULE_SLUGS } from "@/config/modules";
import { isNavModuleAllowedForRoles } from "@/lib/auth/nav-access";
import { isElevatedRole } from "@/lib/auth/user-roles";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { DashboardPresenceProvider } from "@/contexts/DashboardPresenceContext";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/client";
import { AnnouncementsNavBadge } from "./AnnouncementsNavBadge";
import { NotificationMenu } from "./NotificationMenu";
import { FirstLoginPasswordGate } from "./FirstLoginPasswordGate";
import { NotificationsDrawerUnreadCount } from "./NotificationsDrawerUnreadCount";
import { RoleWelcomeVideoPrompt } from "./RoleWelcomeVideoPrompt";
import { CourseGraduateBadge } from "@/components/dashboard/training/CourseGraduateBadge";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { SIGNING_OUT_SESSION_KEY } from "@/lib/auth/session-policy";
import { MAINTENANCE_BANNER_OFFSET_VAR } from "@/lib/maintenance";

const DRAWER_WIDTH = 220;
const maintenanceTop = `var(${MAINTENANCE_BANNER_OFFSET_VAR}, 0px)`;

type NavItem = {
  label: string;
  href: string;
  module: string;
  icon: React.ReactNode;
};

const COURSE_LEARNER_PREFIX = "/dashboard/course";

const MOBILIZE_PREFIX = "/dashboard/mobilize";
const MOBILIZE_HOME = `${MOBILIZE_PREFIX}/map`;

const MOBILIZE_DRAWER_NAV_BASE: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    module: MODULE_SLUGS.dashboard,
    icon: <ArrowBackIcon />,
  },
  {
    label: "Map & Groups",
    href: `${MOBILIZE_PREFIX}/map`,
    module: MODULE_SLUGS.movilization,
    icon: <MapIcon />,
  },
  {
    label: "My Groups",
    href: `${MOBILIZE_PREFIX}/my-groups`,
    module: MODULE_SLUGS.movilization,
    icon: <Groups2OutlinedIcon />,
  },
  {
    label: "Upcoming Activities",
    href: `${MOBILIZE_PREFIX}/activities`,
    module: MODULE_SLUGS.movilization,
    icon: <EventAvailableOutlinedIcon />,
  },
  {
    label: "Notifications",
    href: `${MOBILIZE_PREFIX}/notifications`,
    module: MODULE_SLUGS.movilization,
    icon: <NotificationsActiveOutlinedIcon />,
  },
];

function isNavItemSelected(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (pathname.startsWith(MOBILIZE_PREFIX)) {
    if (item.href === "/dashboard") {
      return false;
    }
    if (item.href === MOBILIZE_HOME && item.module === MODULE_SLUGS.movilization) {
      return pathname === MOBILIZE_HOME || pathname === `${MOBILIZE_PREFIX}/`;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.module === MODULE_SLUGS.training) {
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      pathname === COURSE_LEARNER_PREFIX ||
      pathname.startsWith(`${COURSE_LEARNER_PREFIX}/`)
    );
  }
  if (item.module === MODULE_SLUGS.courses) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  if (item.href === "/dashboard/notifications") {
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      pathname === "/dashboard/communications" ||
      pathname.startsWith("/dashboard/communications/")
    );
  }
  if (item.href === "/dashboard/orders") {
    return (
      pathname === "/dashboard/orders" ||
      (pathname.startsWith("/dashboard/orders/") &&
        !pathname.startsWith("/dashboard/orders/subscriptions"))
    );
  }
  if (item.href === "/dashboard/orders/subscriptions") {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const MOVILIZATION_RED = "#c32020";

const SETTINGS_MODULES = new Set<string>([
  MODULE_SLUGS.emails,
  MODULE_SLUGS.logs,
  MODULE_SLUGS.admins,
  MODULE_SLUGS.adminRoles,
  MODULE_SLUGS.courses,
  MODULE_SLUGS.reports,
  MODULE_SLUGS.donations,
]);

const ORDERS_DRAWER_NAV_BASE: NavItem[] = [
  {
    label: "Orders",
    href: "/dashboard/orders",
    module: MODULE_SLUGS.orders,
    icon: <ReceiptLongIcon />,
  },
  {
    label: "Subscriptions",
    href: "/dashboard/orders/subscriptions",
    module: MODULE_SLUGS.orders,
    icon: <AutorenewIcon />,
  },
];

const NAV: NavItem[] = [
  {
    label: "National overview",
    href: "/dashboard",
    module: MODULE_SLUGS.nationalOverview,
    icon: <PublicIcon />,
  },
  {
    label: "Chapters",
    href: "/dashboard/chapters",
    module: MODULE_SLUGS.chapters,
    icon: <GroupsIcon />,
  },
  {
    label: "Leaders",
    href: "/dashboard/leaders",
    module: MODULE_SLUGS.leaders,
    icon: <MilitaryTechIcon />,
  },
  {
    label: "Community",
    href: "/dashboard/community",
    module: MODULE_SLUGS.community,
    icon: <PeopleIcon />,
  },
  {
    label: "Events",
    href: "/dashboard/gatherings",
    module: MODULE_SLUGS.gatherings,
    icon: <EventIcon />,
  },
  {
    label: "Mobilize",
    href: MOBILIZE_HOME,
    module: MODULE_SLUGS.movilization,
    icon: <FlagOutlined />,
  },
  {
    label: "Administrators",
    href: "/dashboard/admins",
    module: MODULE_SLUGS.admins,
    icon: <AdminPanelSettingsIcon />,
  },
  {
    label: "Training",
    href: "/dashboard/training",
    module: MODULE_SLUGS.training,
    icon: <SchoolIcon />,
  },
  {
    label: "Courses",
    href: "/dashboard/courses",
    module: MODULE_SLUGS.courses,
    icon: <MenuBookIcon />,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    module: MODULE_SLUGS.communications,
    icon: <CampaignIcon />,
  },
  {
    label: "Logs",
    href: "/dashboard/logs",
    module: MODULE_SLUGS.logs,
    icon: <ListAltIcon />,
  },
  {
    label: "Emails",
    href: "/dashboard/emails",
    module: MODULE_SLUGS.emails,
    icon: <EmailIcon />,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    module: MODULE_SLUGS.reports,
    icon: <AssessmentIcon />,
  },
  {
    label: "Donations",
    href: "/dashboard/donations",
    module: MODULE_SLUGS.donations,
    icon: <VolunteerActivismOutlinedIcon />,
  },
  {
    label: "Roles & permissions",
    href: "/dashboard/admin/roles",
    module: MODULE_SLUGS.adminRoles,
    icon: <SecurityIcon />,
  },
];

const drawerPaperSx = (theme: Theme) => ({
  width: DRAWER_WIDTH,
  boxSizing: "border-box" as const,
  bgcolor: "rgba(10,10,12,0.92)",
  backdropFilter: "blur(10px)",
  borderRight: "1px solid rgba(255,215,0,0.12)",
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(255,215,0,0.22) rgba(0,0,0,0.35)",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255,215,0,0.16)",
    borderRadius: 3,
    border: "1px solid rgba(0,0,0,0.2)",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
});

/** Full viewport height on mobile browsers (Safari/Chrome address bar). */
function drawerViewportHeightCss(maintenanceTop: string) {
  return {
    height: `calc(100vh - ${maintenanceTop})`,
    "@supports (height: 100dvh)": {
      height: `calc(100dvh - ${maintenanceTop})`,
    },
  };
}

/**
 * iOS/Android: taps must hit the row, not only label/icon children.
 * 48px min height matches common touch-target guidance.
 */
const NAV_ITEM_TOUCH_SX = {
  minHeight: 48,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  "& .MuiListItemIcon-root, & .MuiListItemText-root": {
    pointerEvents: "none",
  },
} as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const pathname = usePathname();
  const permissions = usePermissions();
  const user = useDashboardUser();
  const isMobilize = pathname.startsWith(MOBILIZE_PREFIX);

  /** Red Mobilize chrome only while inside `/dashboard/mobilize/*` (not persisted). */
  const redNavAccent = isMobilize;

  const mobilizeDrawerNav = useMemo(() => {
    const items = [...MOBILIZE_DRAWER_NAV_BASE];
    if (user.role_names.includes("super_admin")) {
      items.push({
        label: "Mobilize settings",
        href: `${MOBILIZE_PREFIX}/settings`,
        module: MODULE_SLUGS.movilization,
        icon: <SettingsIcon />,
      });
    }
    return items;
  }, [user.role_names]);

  const sidebarOpen = desktop ? desktopDrawerOpen : mobileDrawerOpen;
  const setSidebarOpen = desktop ? setDesktopDrawerOpen : setMobileDrawerOpen;

  const closeMobileDrawer = useCallback(() => {
    if (!desktop) setMobileDrawerOpen(false);
  }, [desktop]);

  const allVisibleNav = NAV.filter((item) => {
    if (item.module === MODULE_SLUGS.movilization) {
      return isElevatedRole(user.role_names) && can(permissions, MODULE_SLUGS.movilization, "read");
    }
    /** Dashboard announcements: all signed-in users (not gated by communications module). */
    if (item.href === "/dashboard/notifications") {
      return true;
    }
    if (!isNavModuleAllowedForRoles(item.module, user.role_names)) {
      return false;
    }
    if (item.module === MODULE_SLUGS.nationalOverview) {
      return (
        can(permissions, MODULE_SLUGS.nationalOverview, "read") ||
        can(permissions, MODULE_SLUGS.dashboard, "read")
      );
    }
    return can(permissions, item.module, "read");
  });
  const settingsAllowedByRole =
    user.role_names.includes("admin") || user.role_names.includes("super_admin");
  const settingsNav = settingsAllowedByRole
    ? allVisibleNav.filter((item) => {
        if (!SETTINGS_MODULES.has(item.module)) return false;
        if (item.module === MODULE_SLUGS.reports) {
          return user.role_names.includes("super_admin");
        }
        return true;
      })
    : [];
  const visibleNav = allVisibleNav.filter((item) => !SETTINGS_MODULES.has(item.module));
  const ordersNav = ORDERS_DRAWER_NAV_BASE.filter((item) => can(permissions, item.module, "read"));
  const settingsHasActive = settingsNav.some((item) => isNavItemSelected(item, pathname));
  const ordersHasActive = ordersNav.some((item) => isNavItemSelected(item, pathname));
  const showSystemNotificationBell =
    user.role_names.includes("admin") || user.role_names.includes("super_admin");
  const showBecomePartner = can(permissions, MODULE_SLUGS.donate, "read");
  const becomePartnerSelected =
    pathname === "/dashboard/donate" || pathname.startsWith("/dashboard/donate/");

  const tourBuildInput = useMemo(
    () => ({
      roleNames: user.role_names,
      visibleNav: visibleNav.filter((item) => item.module !== MODULE_SLUGS.movilization),
      settingsNav,
      mobilizeNav: mobilizeDrawerNav,
      isMobilize,
      showSystemNotificationBell,
      displayName:
        user.display_name?.trim() ||
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.email.split("@")[0] ||
        "",
    }),
    [
      user.role_names,
      user.display_name,
      user.first_name,
      user.last_name,
      user.email,
      visibleNav,
      settingsNav,
      mobilizeDrawerNav,
      isMobilize,
      showSystemNotificationBell,
    ]
  );

  const openSidebarForTour = useCallback(() => {
    setDesktopDrawerOpen(true);
    setMobileDrawerOpen(true);
  }, []);

  const ensureSettingsExpandedForTour = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const openProfileDrawerForTour = useCallback(() => {
    setProfileOpen(true);
  }, []);

  const closeProfileDrawerForTour = useCallback(() => {
    setProfileOpen(false);
  }, []);

  const autoStartMainTour =
    pathname === "/dashboard" || pathname === "/dashboard/";

  useEffect(() => {
    if (settingsHasActive) setSettingsOpen(true);
  }, [settingsHasActive]);

  useEffect(() => {
    if (ordersHasActive) setOrdersOpen(true);
  }, [ordersHasActive]);

  async function handleSignOut() {
    try {
      sessionStorage.setItem(SIGNING_OUT_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    const supabase = createClient();
    try {
      await fetch("/api/auth/session-clear", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  const displayInitial =
    user.display_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.email.split("@")[0];

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexShrink: 0, px: 1.25, pt: 1.25, pb: 1.25 }}>
        <IconButton
          size="small"
          aria-label={sidebarOpen ? "Hide menu" : "Show menu"}
          data-tour="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            color: "primary.main",
            alignSelf: "flex-start",
            mb: 1.5,
            borderRadius: 1,
          }}
        >
          <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0 }}>
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
            <MenuIcon sx={{ fontSize: 22, ml: -0.25 }} />
          </Box>
        </IconButton>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 52,
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: "rgba(0,0,0,0.35)",
            px: 0.75,
            py: 0.5,
            boxSizing: "border-box",
          }}
        >
          <Image
            src={DASHBOARD_DRAWER_LOGO}
            alt=""
            fill
            sizes={`${DRAWER_WIDTH}px`}
            style={{ objectFit: "contain" }}
            priority
            unoptimized
          />
        </Box>
      </Box>
      <Divider sx={{ borderColor: redNavAccent ? "rgba(195,32,32,0.22)" : "rgba(255,215,0,0.2)" }} />
      <List
        sx={{
          flex: 1,
          minHeight: 0,
          py: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
        data-tour="sidebar-nav-scroll"
      >
        {isMobilize ? (
          <>
            {mobilizeDrawerNav.map((item) => {
              const selected = isNavItemSelected(item, pathname);
              return (
                <ListItem key={item.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={selected}
                    data-tour={mobilizeNavTourAttr(item.href)}
                    onClick={closeMobileDrawer}
                    sx={{
                      ...NAV_ITEM_TOUCH_SX,
                      py: 0.75,
                      "&.Mui-selected": {
                        borderLeft: `3px solid ${MOVILIZATION_RED}`,
                        bgcolor: "rgba(195, 32, 32, 0.1)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: selected ? MOVILIZATION_RED : "rgba(255,255,255,0.92)",
                        minWidth: 38,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                        fontSize: "calc(0.82rem + 3px)",
                        color: selected ? MOVILIZATION_RED : "rgba(255,255,255,0.88)",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </>
        ) : (
          visibleNav.map((item) => {
            const selected = isNavItemSelected(item, pathname);
            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={selected}
                  data-tour={`nav-${item.module}`}
                  onClick={closeMobileDrawer}
                  sx={{
                    ...NAV_ITEM_TOUCH_SX,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 0.5,
                    "&.Mui-selected": redNavAccent
                      ? {
                          borderLeft: `3px solid ${MOVILIZATION_RED}`,
                          bgcolor: "rgba(195, 32, 32, 0.1)",
                        }
                      : {
                          borderLeft: "3px solid",
                          borderColor: "primary.main",
                          bgcolor: "rgba(255,215,0,0.08)",
                        },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selected
                        ? redNavAccent
                          ? MOVILIZATION_RED
                          : "primary.main"
                        : "rgba(255,255,255,0.92)",
                      minWidth: 38,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={
                      item.href === "/dashboard/notifications"
                        ? { flex: "1 1 auto", minWidth: 0, m: 0 }
                        : undefined
                    }
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 600,
                      fontSize: "calc(0.82rem + 3px)",
                      color: selected
                        ? redNavAccent
                          ? MOVILIZATION_RED
                          : "primary.main"
                        : "rgba(255,255,255,0.88)",
                    }}
                  />
                  {item.href === "/dashboard/notifications" ? <NotificationsDrawerUnreadCount /> : null}
                </ListItemButton>
              </ListItem>
            );
          })
        )}
        {!isMobilize && ordersNav.length > 0 ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setOrdersOpen((prev) => !prev)}
                selected={ordersHasActive}
                data-tour="nav-orders-group"
                sx={{
                  ...NAV_ITEM_TOUCH_SX,
                  py: 0.75,
                  "&.Mui-selected": redNavAccent
                    ? {
                        borderLeft: `3px solid ${MOVILIZATION_RED}`,
                        bgcolor: "rgba(195, 32, 32, 0.1)",
                      }
                    : {
                        borderLeft: "3px solid",
                        borderColor: "primary.main",
                        bgcolor: "rgba(255,215,0,0.08)",
                      },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: ordersHasActive
                      ? redNavAccent
                        ? MOVILIZATION_RED
                        : "primary.main"
                      : "rgba(255,255,255,0.92)",
                    minWidth: 38,
                  }}
                >
                  <ReceiptLongIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Orders"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 600,
                    fontSize: "calc(0.82rem + 3px)",
                    color: ordersHasActive
                      ? redNavAccent
                        ? MOVILIZATION_RED
                        : "primary.main"
                      : "rgba(255,255,255,0.88)",
                  }}
                />
                {ordersOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>
            <Collapse in={ordersOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {ordersNav.map((item) => {
                  const selected = isNavItemSelected(item, pathname);
                  return (
                    <ListItem key={item.href} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        selected={selected}
                        data-tour={`nav-${item.href.replace(/\//g, "-")}`}
                        onClick={closeMobileDrawer}
                        sx={{
                          ...NAV_ITEM_TOUCH_SX,
                          py: 0.65,
                          pl: 4.5,
                          "&.Mui-selected": redNavAccent
                            ? {
                                borderLeft: `3px solid ${MOVILIZATION_RED}`,
                                bgcolor: "rgba(195, 32, 32, 0.1)",
                              }
                            : {
                                borderLeft: "3px solid",
                                borderColor: "primary.main",
                                bgcolor: "rgba(255,215,0,0.08)",
                              },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selected
                              ? redNavAccent
                                ? MOVILIZATION_RED
                                : "primary.main"
                              : "rgba(255,255,255,0.92)",
                            minWidth: 36,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 500,
                            fontSize: "calc(0.8rem + 3px)",
                            color: selected
                              ? redNavAccent
                                ? MOVILIZATION_RED
                                : "primary.main"
                              : "rgba(255,255,255,0.88)",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </>
        ) : null}
        {!isMobilize && settingsNav.length > 0 ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSettingsOpen((prev) => !prev)}
                selected={settingsHasActive}
                data-tour="nav-settings-group"
                sx={{
                  ...NAV_ITEM_TOUCH_SX,
                  py: 0.75,
                  "&.Mui-selected": redNavAccent
                    ? {
                        borderLeft: `3px solid ${MOVILIZATION_RED}`,
                        bgcolor: "rgba(195, 32, 32, 0.1)",
                      }
                    : {
                        borderLeft: "3px solid",
                        borderColor: "primary.main",
                        bgcolor: "rgba(255,215,0,0.08)",
                      },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: settingsHasActive
                      ? redNavAccent
                        ? MOVILIZATION_RED
                        : "primary.main"
                      : "rgba(255,255,255,0.92)",
                    minWidth: 38,
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Settings"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 600,
                    fontSize: "calc(0.82rem + 3px)",
                    color: settingsHasActive
                      ? redNavAccent
                        ? MOVILIZATION_RED
                        : "primary.main"
                      : "rgba(255,255,255,0.88)",
                  }}
                />
                {settingsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>
            <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {settingsNav.map((item) => {
                  const selected = isNavItemSelected(item, pathname);
                  return (
                    <ListItem key={item.href} disablePadding>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        selected={selected}
                        data-tour={`nav-${item.module}`}
                        onClick={closeMobileDrawer}
                        sx={{
                          ...NAV_ITEM_TOUCH_SX,
                          py: 0.65,
                          pl: 4.5,
                          "&.Mui-selected": redNavAccent
                            ? {
                                borderLeft: `3px solid ${MOVILIZATION_RED}`,
                                bgcolor: "rgba(195, 32, 32, 0.1)",
                              }
                            : {
                                borderLeft: "3px solid",
                                borderColor: "primary.main",
                                bgcolor: "rgba(255,215,0,0.08)",
                              },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selected
                              ? redNavAccent
                                ? MOVILIZATION_RED
                                : "primary.main"
                              : "rgba(255,255,255,0.92)",
                            minWidth: 36,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: 500,
                            fontSize: "calc(0.8rem + 3px)",
                            color: selected
                              ? redNavAccent
                                ? MOVILIZATION_RED
                                : "primary.main"
                              : "rgba(255,255,255,0.88)",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </>
        ) : null}
      </List>
      <Box sx={{ flexShrink: 0 }}>
        {showBecomePartner ? (
          <ListItemButton
            component={Link}
            href="/dashboard/donate"
            selected={becomePartnerSelected}
            data-tour="nav-donate"
            onClick={closeMobileDrawer}
            sx={{
              ...NAV_ITEM_TOUCH_SX,
              px: 2,
              py: 1.25,
              "&.Mui-selected": redNavAccent
                ? {
                    borderLeft: `3px solid ${MOVILIZATION_RED}`,
                    bgcolor: "rgba(195, 32, 32, 0.1)",
                  }
                : {
                    borderLeft: "3px solid",
                    borderColor: "primary.main",
                    bgcolor: "rgba(255,215,0,0.08)",
                  },
            }}
          >
            <ListItemIcon
              sx={{
                color: becomePartnerSelected
                  ? redNavAccent
                    ? MOVILIZATION_RED
                    : "primary.main"
                  : "rgba(255,255,255,0.92)",
                minWidth: 32,
              }}
            >
              <StarOutlineIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Become a Partner"
              primaryTypographyProps={{
                variant: "body2",
                fontWeight: 800,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: becomePartnerSelected
                  ? redNavAccent
                    ? MOVILIZATION_RED
                    : "primary.main"
                  : "rgba(255,255,255,0.95)",
              }}
            />
          </ListItemButton>
        ) : null}
        <Divider sx={{ borderColor: redNavAccent ? "rgba(195,32,32,0.22)" : "rgba(255,215,0,0.2)" }} />
        <Box
          data-tour="sidebar-profile"
          sx={{
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
            cursor: "pointer",
            touchAction: "manipulation",
            "&:hover": { bgcolor: "rgba(255,215,0,0.05)" },
          }}
          onClick={() => setProfileOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setProfileOpen(true);
            }
          }}
        >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar
            src={user.avatar_url ? publicAssetSrc(user.avatar_url) : undefined}
            sx={{ width: 40, height: 40, bgcolor: "primary.dark" }}
          >
            {displayInitial.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.primary" noWrap fontWeight={600}>
              {displayInitial}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {user.email}
            </Typography>
            {user.training_graduate_badge ? (
              <Box sx={{ mt: 0.75 }}>
                <CourseGraduateBadge role={user.training_graduate_badge} />
              </Box>
            ) : null}
          </Box>
        </Box>
        <ListItemButton
          data-tour="sidebar-sign-out"
          {...(isMobilize
            ? ({ component: Link, href: "/dashboard" } as const)
            : ({ component: "button", type: "button" } as const))}
          onClick={(e) => {
            e.stopPropagation();
            if (isMobilize) {
              closeMobileDrawer();
              return;
            }
            void handleSignOut();
          }}
          sx={{ mt: 0.5, borderRadius: 1, ...NAV_ITEM_TOUCH_SX }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "rgba(255,255,255,0.92)" }}>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={isMobilize ? "Dashboard" : "Sign out"}
            primaryTypographyProps={{ variant: "body2", fontSize: "calc(0.875rem + 3px)" }}
          />
        </ListItemButton>
        </Box>
      </Box>
    </Box>
  );

  const appBarShift = desktop && desktopDrawerOpen ? DRAWER_WIDTH : 0;

  return (
    <DashboardTourProvider
      userId={user.id}
      buildInput={tourBuildInput}
      openSidebar={openSidebarForTour}
      ensureSettingsExpanded={ensureSettingsExpandedForTour}
      openProfileDrawer={openProfileDrawerForTour}
      closeProfileDrawer={closeProfileDrawerForTour}
      setProfileEditMode={setProfileEditMode}
      autoStartMainTour={autoStartMainTour}
    >
    <DashboardPresenceProvider userId={user.id}>
      <Box sx={{ minHeight: "100vh" }}>
      <FirstLoginPasswordGate />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          top: maintenanceTop,
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "rgba(12,12,14,0.88)",
          backdropFilter: "blur(8px)",
          borderBottom: redNavAccent ? "1px solid rgba(195,32,32,0.18)" : "1px solid rgba(255,215,0,0.12)",
          width: { xs: "100%", md: `calc(100% - ${appBarShift}px)` },
          ml: { md: `${appBarShift}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1 }}>
          {!desktop ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Menu"
            >
              <MenuIcon />
            </IconButton>
          ) : !desktopDrawerOpen ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDesktopDrawerOpen(true)}
              aria-label="Show sidebar"
              size="small"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <RoleWelcomeVideoPrompt />
          <DashboardTourHelpButton />
          <Box data-tour="header-notifications" sx={{ display: "inline-flex", alignItems: "center" }}>
            {showSystemNotificationBell ? (
              <NotificationMenu userId={user.id} />
            ) : (
              <AnnouncementsNavBadge />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={desktop ? "persistent" : "temporary"}
        open={desktop ? desktopDrawerOpen : mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        disableScrollLock={!desktop}
        ModalProps={{ keepMounted: true }}
        sx={{
          flexShrink: 0,
          ...(desktop
            ? {
                width: DRAWER_WIDTH,
                [`& .MuiDrawer-paper`]: {
                  ...drawerPaperSx(theme),
                  ...(redNavAccent
                    ? {
                        borderRight: "1px solid rgba(195,32,32,0.22)",
                        scrollbarColor: "rgba(195,32,32,0.28) rgba(0,0,0,0.35)",
                      }
                    : {}),
                  position: "fixed",
                  top: maintenanceTop,
                  ...drawerViewportHeightCss(maintenanceTop),
                },
              }
            : {
                [`& .MuiDrawer-paper`]: {
                  ...drawerPaperSx(theme),
                  ...(redNavAccent
                    ? {
                        borderRight: "1px solid rgba(195,32,32,0.22)",
                        scrollbarColor: "rgba(195,32,32,0.28) rgba(0,0,0,0.35)",
                      }
                    : {}),
                  top: maintenanceTop,
                  ...drawerViewportHeightCss(maintenanceTop),
                  touchAction: "pan-y",
                },
              }),
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          pt: `calc(${theme.spacing(7)} + ${maintenanceTop})`,
          px: { xs: 2, sm: 3 },
          pb: "calc(32px + env(safe-area-inset-bottom, 0px))",
          ml: { md: desktopDrawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          minHeight: "100vh",
          color: "grey.100",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>

      <UserProfileDrawer
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setProfileEditMode(false);
        }}
        editMode={profileEditMode}
        onEditModeChange={setProfileEditMode}
      />
    </Box>
    </DashboardPresenceProvider>
    </DashboardTourProvider>
  );
}
