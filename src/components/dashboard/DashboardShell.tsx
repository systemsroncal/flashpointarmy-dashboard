"use client";

import AdjustIcon from "@mui/icons-material/Adjust";
import TimelineIcon from "@mui/icons-material/Timeline";
import WhereToVoteIcon from "@mui/icons-material/WhereToVote";
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
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import PeopleIcon from "@mui/icons-material/People";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PublicIcon from "@mui/icons-material/Public";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import SchoolIcon from "@mui/icons-material/School";
import SportsIcon from "@mui/icons-material/Sports";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import {
  AppBar,
  Box,
  Button,
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
import {
  canAccessPeopleLeaders,
  canAccessPeopleMembers,
  canAccessPeopleOverview,
} from "@/lib/auth/people-section-access";
import { canAccessMobilizeModule, canSeeMobilizeNavItem, isElevatedRole } from "@/lib/auth/user-roles";
import { isMemberOnboardingAudience } from "@/lib/onboarding/member-onboarding-status";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { DashboardPresenceProvider } from "@/contexts/DashboardPresenceContext";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/client";
import { AnnouncementsNavBadge } from "./AnnouncementsNavBadge";
import { HeaderAccountSettingsButton } from "./HeaderAccountSettingsButton";
import { NotificationMenu } from "./NotificationMenu";
import { FirstLoginPasswordGate } from "./FirstLoginPasswordGate";
import { NotificationsDrawerUnreadCount } from "./NotificationsDrawerUnreadCount";
import { RoleWelcomeVideoPrompt } from "./RoleWelcomeVideoPrompt";
import { SidebarYourJourney } from "./SidebarYourJourney";
import { TrainingNavSubmenu } from "@/components/dashboard/training/TrainingNavSubmenu";
import {
  AvatarWithGraduateIcon,
  CourseGraduateCongratulationsDialog,
} from "@/components/dashboard/training/CourseGraduateBadge";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { SIGNING_OUT_SESSION_KEY } from "@/lib/auth/session-policy";
import { MAINTENANCE_BANNER_OFFSET_VAR } from "@/lib/maintenance";
import { flashpointYellow } from "@/theme/tokens";
import { MobilizeSidebarNav } from "@/components/mobilize/MobilizeSidebarNav";

const DRAWER_WIDTH = 220;

/** Mobilize sidebar: back links — outline only, no fill. */
const MOBILIZE_DASHBOARD_NAV_ITEM_SX = {
  mx: 1,
  mb: 0.75,
  borderRadius: 1.5,
  border: "1px solid rgba(255, 255, 255, 0.22)",
  bgcolor: "transparent",
  transition: "border-color 0.15s ease",
  "&:hover": {
    bgcolor: "transparent",
    borderColor: "rgba(255, 215, 0, 0.55)",
    "& .MuiListItemIcon-root": { color: flashpointYellow },
    "& .MuiListItemText-primary": { color: flashpointYellow },
  },
  "&.Mui-selected": {
    borderLeft: "1px solid rgba(255, 215, 0, 0.4) !important",
    bgcolor: "transparent",
    borderColor: "rgba(255, 215, 0, 0.4)",
    "& .MuiListItemIcon-root": { color: flashpointYellow },
    "& .MuiListItemText-primary": { color: flashpointYellow },
  },
} as const;

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
    label: "Chapters",
    href: `${MOBILIZE_PREFIX}/map`,
    module: MODULE_SLUGS.movilization,
    icon: <MapIcon />,
  },
  {
    label: "Groups",
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

const NAV_SELECTED_SX = {
  borderLeft: "3px solid",
  borderColor: "primary.main",
  bgcolor: "rgba(255,215,0,0.08)",
} as const;

const SETTINGS_MODULES = new Set<string>([
  MODULE_SLUGS.emails,
  MODULE_SLUGS.logs,
  MODULE_SLUGS.admins,
  MODULE_SLUGS.adminRoles,
  MODULE_SLUGS.courses,
  MODULE_SLUGS.reports,
  MODULE_SLUGS.donations,
]);

const MISSION_PIPELINE_HREFS = new Set<string>([
  "/dashboard/courses/certificate-requests",
  "/dashboard/onboarding/coach-meetings",
  "/dashboard/onboarding/biblical-citizenship-progress",
  "/dashboard/onboarding/first-missions",
  "/dashboard/onboarding/ready-for-chapter",
  "/dashboard/onboarding/journey-progress",
  "/dashboard/onboarding/user-notes",
]);

const MISSION_PIPELINE_NAV: NavItem[] = [
  {
    label: "Certificate requests",
    href: "/dashboard/courses/certificate-requests",
    module: MODULE_SLUGS.courses,
    icon: <FactCheckOutlinedIcon />,
  },
  {
    label: "Coach meetings",
    href: "/dashboard/onboarding/coach-meetings",
    module: MODULE_SLUGS.courses,
    icon: <HandshakeOutlinedIcon />,
  },
  {
    label: "Biblical Citizenship Progress",
    href: "/dashboard/onboarding/biblical-citizenship-progress",
    module: MODULE_SLUGS.courses,
    icon: <TimelineIcon />,
  },
  {
    label: "Mission Selected",
    href: "/dashboard/onboarding/first-missions",
    module: MODULE_SLUGS.courses,
    icon: <FlagOutlined />,
  },
  {
    label: "Ready for Chapter",
    href: "/dashboard/onboarding/ready-for-chapter",
    module: MODULE_SLUGS.courses,
    icon: <WhereToVoteIcon />,
  },
  {
    label: "Journey progress",
    href: "/dashboard/onboarding/journey-progress",
    module: MODULE_SLUGS.courses,
    icon: <InsightsOutlinedIcon />,
  },
  {
    label: "User Notes",
    href: "/dashboard/onboarding/user-notes",
    module: MODULE_SLUGS.courses,
    icon: <NoteOutlinedIcon />,
  },
];

const PEOPLE_HREFS = new Set<string>([
  "/dashboard/people",
  "/dashboard/leaders",
  "/dashboard/community",
]);

const PEOPLE_NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard/people",
    module: MODULE_SLUGS.community,
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: "Leaders",
    href: "/dashboard/leaders",
    module: MODULE_SLUGS.leaders,
    icon: <MilitaryTechIcon />,
  },
  {
    label: "Members",
    href: "/dashboard/community",
    module: MODULE_SLUGS.community,
    icon: <PeopleIcon />,
  },
];

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
    label: "Churches",
    href: "/dashboard/chapters",
    module: MODULE_SLUGS.chapters,
    icon: <GroupsIcon />,
  },
  {
    label: "FPA Events",
    href: "/dashboard/gatherings",
    module: MODULE_SLUGS.gatherings,
    icon: <EventIcon />,
  },
  {
    label: "Chapters",
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
    label: "Coaches",
    href: "/dashboard/settings/coaches",
    module: MODULE_SLUGS.courses,
    icon: <SportsIcon />,
  },
  {
    label: "Mission Updates",
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

function PeopleNavGroup({
  peopleNav,
  peopleOpen,
  setPeopleOpen,
  peopleHasActive,
  pathname,
  closeMobileDrawer,
}: {
  peopleNav: NavItem[];
  peopleOpen: boolean;
  setPeopleOpen: React.Dispatch<React.SetStateAction<boolean>>;
  peopleHasActive: boolean;
  pathname: string;
  closeMobileDrawer: () => void;
}) {
  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setPeopleOpen((prev) => !prev)}
          selected={peopleHasActive}
          data-tour="nav-people-group"
          sx={{
            ...NAV_ITEM_TOUCH_SX,
            py: 0.75,
            "&.Mui-selected": NAV_SELECTED_SX,
          }}
        >
          <ListItemIcon
            sx={{
              color: peopleHasActive ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText
            primary="People"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: peopleHasActive ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {peopleOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={peopleOpen} timeout="auto" unmountOnExit>
        <List disablePadding>
          {peopleNav.map((item) => {
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
                    "&.Mui-selected": NAV_SELECTED_SX,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selected ? "primary.main" : "rgba(255,255,255,0.92)",
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
                      color: selected ? "primary.main" : "rgba(255,255,255,0.88)",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [graduateCongratsOpen, setGraduateCongratsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missionPipelineOpen, setMissionPipelineOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const pathname = usePathname();
  const permissions = usePermissions();
  const user = useDashboardUser();
  const isMobilize =
    pathname.startsWith(MOBILIZE_PREFIX) && canAccessMobilizeModule(user.role_names);
  const onMobilizeSocialHub =
    isMobilize &&
    (pathname === `${MOBILIZE_PREFIX}/home` ||
      pathname === MOBILIZE_PREFIX ||
      pathname === `/dashboard/mobilize/profile/${user.id}`);
  const onMobilizeProfilePage =
    isMobilize && pathname.startsWith(`${MOBILIZE_PREFIX}/profile/`);
  const onMobilizeSocialHubPage =
    isMobilize &&
    (pathname === `${MOBILIZE_PREFIX}/home` ||
      pathname === MOBILIZE_PREFIX ||
      onMobilizeProfilePage ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/bookmarks`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/alerts`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/messages`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/social-settings`));

  useEffect(() => {
    if (!onMobilizeSocialHubPage) return;
    setDesktopDrawerOpen(false);
    setMobileDrawerOpen(false);
  }, [onMobilizeSocialHubPage, pathname]);

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
      return canSeeMobilizeNavItem(user.role_names);
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
  const missionPipelineAllowed = settingsAllowedByRole;
  const missionPipelineNav = missionPipelineAllowed
    ? MISSION_PIPELINE_NAV.filter((item) => can(permissions, item.module, "read"))
    : [];
  const peopleNav = isElevatedRole(user.role_names)
    ? PEOPLE_NAV.filter((item) => {
        if (item.href === "/dashboard/people") {
          return canAccessPeopleOverview(user.role_names, permissions);
        }
        if (item.href === "/dashboard/leaders") {
          return canAccessPeopleLeaders(user.role_names, permissions);
        }
        if (item.href === "/dashboard/community") {
          return canAccessPeopleMembers(user.role_names, permissions);
        }
        return false;
      })
    : [];
  const settingsNav = settingsAllowedByRole
    ? allVisibleNav.filter((item) => {
        if (MISSION_PIPELINE_HREFS.has(item.href)) return false;
        if (!SETTINGS_MODULES.has(item.module)) return false;
        if (item.module === MODULE_SLUGS.reports) {
          return user.role_names.includes("super_admin");
        }
        return true;
      })
    : [];
  const visibleNav = allVisibleNav.filter(
    (item) =>
      !SETTINGS_MODULES.has(item.module) &&
      !MISSION_PIPELINE_HREFS.has(item.href) &&
      !PEOPLE_HREFS.has(item.href)
  );
  const ordersNav = ORDERS_DRAWER_NAV_BASE.filter((item) => can(permissions, item.module, "read"));
  const settingsHasActive = settingsNav.some((item) => isNavItemSelected(item, pathname));
  const missionPipelineHasActive = missionPipelineNav.some((item) =>
    isNavItemSelected(item, pathname)
  );
  const peopleHasActive = peopleNav.some((item) => isNavItemSelected(item, pathname));
  const ordersHasActive = ordersNav.some((item) => isNavItemSelected(item, pathname));

  const showSystemNotificationBell =
    user.role_names.includes("admin") ||
    user.role_names.includes("super_admin") ||
    user.role_names.includes("sub_admin");

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

  useEffect(() => {
    if (settingsHasActive) setSettingsOpen(true);
  }, [settingsHasActive]);

  useEffect(() => {
    if (missionPipelineHasActive) setMissionPipelineOpen(true);
  }, [missionPipelineHasActive]);

  useEffect(() => {
    if (peopleHasActive) setPeopleOpen(true);
  }, [peopleHasActive]);

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

  const showSidebarJourney =
    !isMobilize && isMemberOnboardingAudience(user.role_names) && user.member_onboarding;
  const showTrainingSubmenu = showSidebarJourney && Boolean(user.member_onboarding);

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
      <Divider sx={{ borderColor: "rgba(255,215,0,0.2)" }} />
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
          <MobilizeSidebarNav
            onNavigate={closeMobileDrawer}
            showSettings={user.role_names.includes("super_admin")}
          />
        ) : (
          <>
            {visibleNav.map((item) => {
              const selected = isNavItemSelected(item, pathname);
              const afterChapters =
                item.href === "/dashboard/chapters" && peopleNav.length > 0 ? (
                  <PeopleNavGroup
                    key="people-group"
                    peopleNav={peopleNav}
                    peopleOpen={peopleOpen}
                    setPeopleOpen={setPeopleOpen}
                    peopleHasActive={peopleHasActive}
                    pathname={pathname}
                    closeMobileDrawer={closeMobileDrawer}
                  />
                ) : null;
              if (item.href === "/dashboard/training" && showTrainingSubmenu && user.member_onboarding) {
                return (
                  <TrainingNavSubmenu
                    key={item.href}
                    snapshot={user.member_onboarding}
                    selectedParent={selected || pathname.startsWith("/dashboard/training/")}
                    onNavigate={closeMobileDrawer}
                    navItemTouchSx={NAV_ITEM_TOUCH_SX}
                    navSelectedSx={NAV_SELECTED_SX}
                  />
                );
              }
              if (
                item.module === MODULE_SLUGS.movilization &&
                !canAccessMobilizeModule(user.role_names)
              ) {
                return (
                  <Box key={item.href} component="span" sx={{ display: "contents" }}>
                    <ListItem disablePadding>
                      <ListItemButton
                        disabled
                        aria-disabled
                        data-tour={`nav-${item.module}`}
                        sx={{
                          ...NAV_ITEM_TOUCH_SX,
                          py: 0.75,
                          opacity: 0.42,
                          cursor: "default",
                          "&.Mui-disabled": { opacity: 0.42 },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: "rgba(255,255,255,0.5)",
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
                            color: "rgba(255,255,255,0.45)",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                    {afterChapters}
                  </Box>
                );
              }
              return (
                <Box key={item.href} component="span" sx={{ display: "contents" }}>
                  <ListItem disablePadding>
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
                        "&.Mui-selected": NAV_SELECTED_SX,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: selected ? "primary.main" : "rgba(255,255,255,0.92)",
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
                          color: selected ? "primary.main" : "rgba(255,255,255,0.88)",
                        }}
                      />
                      {item.href === "/dashboard/notifications" ? <NotificationsDrawerUnreadCount /> : null}
                    </ListItemButton>
                  </ListItem>
                  {afterChapters}
                </Box>
              );
            })}
            {!visibleNav.some((i) => i.href === "/dashboard/chapters") && peopleNav.length > 0 ? (
              <PeopleNavGroup
                peopleNav={peopleNav}
                peopleOpen={peopleOpen}
                setPeopleOpen={setPeopleOpen}
                peopleHasActive={peopleHasActive}
                pathname={pathname}
                closeMobileDrawer={closeMobileDrawer}
              />
            ) : null}
          </>
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
                  "&.Mui-selected": NAV_SELECTED_SX,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: ordersHasActive
                      ? "primary.main"
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
                      ? "primary.main"
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
                          "&.Mui-selected": NAV_SELECTED_SX,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selected
                              ? "primary.main"
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
                              ? "primary.main"
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
        {!isMobilize && missionPipelineNav.length > 0 ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setMissionPipelineOpen((prev) => !prev)}
                selected={missionPipelineHasActive}
                data-tour="nav-mission-pipeline-group"
                sx={{
                  ...NAV_ITEM_TOUCH_SX,
                  py: 0.75,
                  "&.Mui-selected": NAV_SELECTED_SX,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: missionPipelineHasActive
                      ? "primary.main"
                      : "rgba(255,255,255,0.92)",
                    minWidth: 38,
                  }}
                >
                  <AdjustIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Mission Pipeline"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: 600,
                    fontSize: "calc(0.82rem + 3px)",
                    color: missionPipelineHasActive
                      ? "primary.main"
                      : "rgba(255,255,255,0.88)",
                  }}
                />
                {missionPipelineOpen ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </ListItemButton>
            </ListItem>
            <Collapse in={missionPipelineOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {missionPipelineNav.map((item) => {
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
                          "&.Mui-selected": NAV_SELECTED_SX,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selected ? "primary.main" : "rgba(255,255,255,0.92)",
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
                            color: selected ? "primary.main" : "rgba(255,255,255,0.88)",
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
                  "&.Mui-selected": NAV_SELECTED_SX,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: settingsHasActive
                      ? "primary.main"
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
                      ? "primary.main"
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
                          "&.Mui-selected": NAV_SELECTED_SX,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: selected
                              ? "primary.main"
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
                              ? "primary.main"
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
        {showSidebarJourney ? (
          <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
            <SidebarYourJourney snapshot={user.member_onboarding!} />
          </Box>
        ) : null}
      </List>
      {showSidebarJourney ? (
        <Box sx={{ flexShrink: 0, px: 1.5, pt: 0.5, pb: 1 }}>
          <Button
            component={Link}
            href="/dashboard/training"
            fullWidth
            variant="contained"
            startIcon={<AdjustIcon />}
            onClick={closeMobileDrawer}
            sx={{
              fontWeight: 800,
              color: "#0a0a0a",
              bgcolor: "primary.main",
              borderRadius: 2,
              py: 1.1,
              minHeight: 44,
              touchAction: "manipulation",
              "&:hover": { bgcolor: "primary.light" },
            }}
          >
            Get Equipped
          </Button>
        </Box>
      ) : null}
      <Box sx={{ flexShrink: 0 }}>
        <Divider sx={{ borderColor: "rgba(255,215,0,0.2)" }} />
        <Box
          data-tour="sidebar-profile"
          sx={{
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom, 0px))",
            touchAction: "manipulation",
          }}
        >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <AvatarWithGraduateIcon
            size={40}
            overlayStyle="sidebar"
            graduateRole={user.training_graduate_badge}
            showAdminCrown={isElevatedRole(user.role_names)}
            src={user.avatar_url ? publicAssetSrc(user.avatar_url) : undefined}
            alt={displayInitial}
            avatarSx={{ bgcolor: "primary.dark" }}
            onGraduateClick={
              user.training_graduate_badge ? () => setGraduateCongratsOpen(true) : undefined
            }
          >
            {displayInitial.slice(0, 2).toUpperCase()}
          </AvatarWithGraduateIcon>
          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              cursor: "pointer",
              "&:hover": { opacity: 0.92 },
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
            <Typography variant="body2" color="text.primary" noWrap fontWeight={600}>
              {displayInitial}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>
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
          borderBottom: "1px solid rgba(255,215,0,0.12)",
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
          <HeaderAccountSettingsButton
            onOpenProfile={() => setProfileOpen(true)}
            onSignOut={() => void handleSignOut()}
          />
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
                  position: "fixed",
                  top: maintenanceTop,
                  ...drawerViewportHeightCss(maintenanceTop),
                },
              }
            : {
                [`& .MuiDrawer-paper`]: {
                  ...drawerPaperSx(theme),
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
          px: isMobilize ? { xs: 1, sm: 2, md: 3 } : { xs: 2, sm: 3 },
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

      <CourseGraduateCongratulationsDialog
        open={graduateCongratsOpen}
        onClose={() => setGraduateCongratsOpen(false)}
        firstName={user.first_name}
        lastName={user.last_name}
        displayName={user.display_name}
        email={user.email}
      />

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
