"use client";

import AdjustIcon from "@mui/icons-material/Adjust";
import TimelineIcon from "@mui/icons-material/Timeline";
import CampaignIcon from "@mui/icons-material/Campaign";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventIcon from "@mui/icons-material/Event";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import MapIcon from "@mui/icons-material/Map";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import PeopleIcon from "@mui/icons-material/People";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import SchoolIcon from "@mui/icons-material/School";
import SportsIcon from "@mui/icons-material/Sports";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { DashboardTourHelpButton, DashboardTourProvider } from "@/components/dashboard/DashboardTour";
import { scrollTourTargetIntoView } from "@/lib/dashboard/dashboard-tour-actions";
import { DASHBOARD_DRAWER_LOGO } from "@/config/login";
import { MODULE_SLUGS } from "@/config/modules";
import { isNavModuleAllowedForRoles } from "@/lib/auth/nav-access";
import {
  canAccessPeopleLeaders,
  canAccessPeopleMembers,
  canAccessPeopleOverview,
} from "@/lib/auth/people-section-access";
import { canAccessMobilizeModule, canSeeMobilizeNavItem, isChapterStaffRole, isElevatedRole } from "@/lib/auth/user-roles";
import { shouldShowSidebarYourJourney } from "@/lib/onboarding/member-onboarding-status";
import { cacheBustAssetUrl } from "@/lib/media/public-asset-url";
import {
  subscribeProfileMediaUpdated,
} from "@/lib/user/profile-media-events";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { DashboardPresenceProvider } from "@/contexts/DashboardPresenceContext";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/client";
import { UserNotificationsMenu } from "./UserNotificationsMenu";
import { MissionUpdatesNavIcon } from "./MissionUpdatesNavIcon";
import { MissionUpdatesUnreadProvider } from "./MissionUpdatesUnreadProvider";
import { HeaderSuperAdminProfileAvatar } from "./HeaderSuperAdminProfileAvatar";
import { GlobalContainerShareItemListener } from "./GlobalContainerShareItemListener";
import { NotificationMenu } from "./NotificationMenu";
import { FirstLoginPasswordGate } from "./FirstLoginPasswordGate";
import { NotificationsDrawerUnreadCount } from "./NotificationsDrawerUnreadCount";
import { RoleWelcomeVideoPrompt } from "./RoleWelcomeVideoPrompt";
import { SidebarYourJourney } from "./SidebarYourJourney";
import { SidebarNestedNavList } from "./SidebarNestedNavList";
import { ChaptersGroupsNavGroup } from "./ChaptersGroupsNavGroup";
import { MobilizeSettingsNavGroup } from "./MobilizeSettingsNavGroup";
import { TrainingNavSubmenu } from "@/components/dashboard/training/TrainingNavSubmenu";
import {
  AvatarWithGraduateIcon,
  CourseGraduateBadge,
  CourseGraduateCongratulationsDialog,
} from "@/components/dashboard/training/CourseGraduateBadge";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { SIGNING_OUT_SESSION_KEY } from "@/lib/auth/session-policy";
import { MAINTENANCE_BANNER_OFFSET_VAR } from "@/lib/maintenance";
import { flashpointYellow } from "@/theme/tokens";
import { PoweredByDreamsAnimation } from "@/components/PoweredByDreamsAnimation";
import {
  MOBILIZE_ACTIVITIES_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_PREFIX as MOBILIZE_PREFIX_CANON,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";

const DRAWER_WIDTH = 220;

const maintenanceTop = `var(${MAINTENANCE_BANNER_OFFSET_VAR}, 0px)`;

type NavItem = {
  label: string;
  href: string;
  module: string;
  icon: React.ReactNode;
};

const COURSE_LEARNER_PREFIX = "/dashboard/course";

const MOBILIZE_PREFIX = MOBILIZE_PREFIX_CANON;

/** Tour-only snapshot of Mobilize-related links (drawer is now unified). */
const MOBILIZE_DRAWER_NAV_BASE: NavItem[] = [
  {
    label: "Feed",
    href: MOBILIZE_HOME_HREF,
    module: MODULE_SLUGS.movilization,
    icon: <HomeOutlinedIcon />,
  },
  {
    label: "Find Chapters",
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
    label: "Deployment",
    href: MOBILIZE_ACTIVITIES_HREF,
    module: MODULE_SLUGS.movilization,
    icon: <EventAvailableOutlinedIcon />,
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
    // Profile / feed / deployment: exact or nested under that path.
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
    if (isMissionPipelinePath(pathname)) return false;
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
  if (item.href === "/dashboard/courses") {
    if (isMissionPipelinePath(pathname)) return false;
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
]);

/** Settings entries whose module stays in the main nav (e.g. Events). */
const SETTINGS_EXTRA_HREFS = new Set<string>(["/dashboard/settings/event-categories"]);

const MISSION_PIPELINE_HREFS = new Set<string>([
  "/dashboard/courses/certificate-requests",
  "/dashboard/onboarding/coach-meetings",
  "/dashboard/onboarding/biblical-citizenship-progress",
  "/dashboard/onboarding/first-missions",
  "/dashboard/onboarding/ready-for-chapter",
  "/dashboard/onboarding/journey-progress",
]);

const BIBCIT_PROGRESS_NAV_TOUR_ATTR = "nav--dashboard-onboarding-biblical-citizenship-progress";

const COURSE_PROGRESS_PATH_RE = /^\/dashboard\/courses\/[^/]+\/progress(?:\/|$)/;

/** Course progress admin (BibCit) lives under /dashboard/courses/:id/progress after redirect. */
function isMissionPipelinePath(pathname: string): boolean {
  for (const href of MISSION_PIPELINE_HREFS) {
    if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  }
  if (COURSE_PROGRESS_PATH_RE.test(pathname)) return true;
  return false;
}

function isMissionPipelineNavItemSelected(item: NavItem, pathname: string): boolean {
  if (item.href === "/dashboard/onboarding/biblical-citizenship-progress") {
    return (
      pathname === item.href || COURSE_PROGRESS_PATH_RE.test(pathname)
    );
  }
  return isNavItemSelected(item, pathname);
}

const MISSION_PIPELINE_NAV: NavItem[] = [
  {
    label: "Journey progress",
    href: "/dashboard/onboarding/journey-progress",
    module: MODULE_SLUGS.courses,
    icon: <InsightsOutlinedIcon />,
  },
  {
    label: "BibCit Verification",
    href: "/dashboard/courses/certificate-requests",
    module: MODULE_SLUGS.courses,
    icon: <FactCheckOutlinedIcon />,
  },
  {
    label: "BibCit Progress",
    href: "/dashboard/onboarding/biblical-citizenship-progress",
    module: MODULE_SLUGS.courses,
    icon: <TimelineIcon />,
  },
];

const PEOPLE_HREFS = new Set<string>([
  "/dashboard/people",
  "/dashboard/leaders",
  "/dashboard/community",
  "/dashboard/onboarding/user-notes",
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
  {
    label: "User Notes",
    href: "/dashboard/onboarding/user-notes",
    module: MODULE_SLUGS.courses,
    icon: <NoteOutlinedIcon />,
  },
];

const NAV: NavItem[] = [
  {
    label: "National overview",
    href: "/dashboard",
    module: MODULE_SLUGS.nationalOverview,
    icon: <HomeOutlinedIcon />,
  },
  // Chapters & Groups is rendered as ChaptersGroupsNavGroup (not a flat link).
  {
    label: "Training",
    href: "/dashboard/training",
    module: MODULE_SLUGS.training,
    icon: <SchoolIcon />,
  },
  {
    label: "Deployment",
    href: MOBILIZE_ACTIVITIES_HREF,
    module: MODULE_SLUGS.movilization,
    icon: <EventAvailableOutlinedIcon />,
  },
  {
    label: "Events",
    href: "/dashboard/gatherings",
    module: MODULE_SLUGS.gatherings,
    icon: <EventIcon />,
  },
  {
    label: "Mission Updates",
    href: "/dashboard/notifications",
    module: MODULE_SLUGS.communications,
    icon: <CampaignIcon />,
  },
  {
    label: "Feed",
    href: MOBILIZE_HOME_HREF,
    module: MODULE_SLUGS.movilization,
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: "Profile",
    href: "__PROFILE__", // replaced at render with the signed-in user's profile href
    module: MODULE_SLUGS.movilization,
    icon: <PersonOutlineIcon />,
  },
  {
    label: "Churches",
    href: "/dashboard/chapters",
    module: MODULE_SLUGS.chapters,
    icon: <GroupsIcon />,
  },
  {
    label: "Administrators",
    href: "/dashboard/admins",
    module: MODULE_SLUGS.admins,
    icon: <AdminPanelSettingsIcon />,
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
    label: "Event categories",
    href: "/dashboard/settings/event-categories",
    module: MODULE_SLUGS.gatherings,
    icon: <CategoryOutlinedIcon />,
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
    label: "FPA Analytics",
    href: "/dashboard/reports",
    module: MODULE_SLUGS.reports,
    icon: <AssessmentIcon />,
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

function MissionPipelineNavGroup({
  missionPipelineNav,
  missionPipelineOpen,
  setMissionPipelineOpen,
  missionPipelineHasActive,
  pathname,
  closeMobileDrawer,
}: {
  missionPipelineNav: NavItem[];
  missionPipelineOpen: boolean;
  setMissionPipelineOpen: React.Dispatch<React.SetStateAction<boolean>>;
  missionPipelineHasActive: boolean;
  pathname: string;
  closeMobileDrawer: () => void;
}) {
  return (
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
              color: missionPipelineHasActive ? "primary.main" : "rgba(255,255,255,0.92)",
              minWidth: 38,
            }}
          >
            <AdjustIcon />
          </ListItemIcon>
          <ListItemText
            primary="Member Journey"
            primaryTypographyProps={{
              variant: "body2",
              fontWeight: 600,
              fontSize: "calc(0.82rem + 3px)",
              color: missionPipelineHasActive ? "primary.main" : "rgba(255,255,255,0.88)",
            }}
          />
          {missionPipelineOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </ListItemButton>
      </ListItem>
      <Collapse in={missionPipelineOpen} timeout="auto" unmountOnExit>
        <SidebarNestedNavList
          items={missionPipelineNav.map((item) => ({
            key: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
            selected: isMissionPipelineNavItemSelected(item, pathname),
            tourAttr: `nav-${item.href.replace(/\//g, "-")}`,
          }))}
          onNavigate={closeMobileDrawer}
        />
      </Collapse>
    </>
  );
}

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
        <SidebarNestedNavList
          items={peopleNav.map((item) => ({
            key: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
            selected: isNavItemSelected(item, pathname),
            tourAttr: `nav-${item.href.replace(/\//g, "-")}`,
          }))}
          onNavigate={closeMobileDrawer}
        />
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
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null);
  const [liveAvatarNonce, setLiveAvatarNonce] = useState(0);
  const pathname = usePathname();
  const permissions = usePermissions();
  const user = useDashboardUser();

  useEffect(() => {
    return subscribeProfileMediaUpdated((detail) => {
      if (detail.avatar_url !== undefined) {
        setLiveAvatarUrl(detail.avatar_url);
        setLiveAvatarNonce(Date.now());
      }
    });
  }, []);

  useEffect(() => {
    setLiveAvatarUrl(null);
    setLiveAvatarNonce(0);
  }, [user.avatar_url]);

  const shellAvatarSrc = (() => {
    const url = liveAvatarUrl !== null ? liveAvatarUrl : user.avatar_url;
    if (!url?.trim()) return undefined;
    return cacheBustAssetUrl(url.trim(), liveAvatarNonce || undefined);
  })();

  const mobilizeViewerRoles = user.mobilize_chapters_viewer_roles ?? [];
  const mobilizeViewerUserIds = user.mobilize_chapters_viewer_user_ids ?? [];
  const mobilizeAccessOpts = {
    userId: user.id,
    viewerUserIds: mobilizeViewerUserIds,
  };
  const isMobilize =
    pathname.startsWith(MOBILIZE_PREFIX) &&
    canAccessMobilizeModule(user.role_names, mobilizeViewerRoles, mobilizeAccessOpts);
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
    /** Keep dashboard left sidebar open on Mobilize social hub pages (home, messages, etc.). */
    if (onMobilizeSocialHubPage || onMobilizeProfilePage) {
      if (desktop) setDesktopDrawerOpen(true);
    }
  }, [onMobilizeSocialHubPage, onMobilizeProfilePage, pathname, desktop]);

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
      return canSeeMobilizeNavItem(user.role_names, mobilizeViewerRoles, mobilizeAccessOpts);
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
        if (item.href === "/dashboard/onboarding/user-notes") {
          return isChapterStaffRole(user.role_names) && can(permissions, MODULE_SLUGS.courses, "read");
        }
        return false;
      })
    : [];
  const settingsNav = settingsAllowedByRole
    ? allVisibleNav.filter((item) => {
        if (MISSION_PIPELINE_HREFS.has(item.href)) return false;
        if (SETTINGS_EXTRA_HREFS.has(item.href)) return true;
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
      !SETTINGS_EXTRA_HREFS.has(item.href) &&
      !MISSION_PIPELINE_HREFS.has(item.href) &&
      !PEOPLE_HREFS.has(item.href)
  );
  const settingsHasActive =
    !isMissionPipelinePath(pathname) &&
    settingsNav.some((item) => isNavItemSelected(item, pathname));
  const missionPipelineHasActive = isMissionPipelinePath(pathname);
  const peopleHasActive = peopleNav.some((item) => isNavItemSelected(item, pathname));

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
    if (missionPipelineHasActive) {
      setMissionPipelineOpen(true);
    }
  }, [missionPipelineHasActive]);

  useEffect(() => {
    if (peopleHasActive) setPeopleOpen(true);
  }, [peopleHasActive]);

  useEffect(() => {
    if (!COURSE_PROGRESS_PATH_RE.test(pathname)) return;
    setMissionPipelineOpen(true);
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-tour="${BIBCIT_PROGRESS_NAV_TOUR_ATTR}"]`);
      if (el) scrollTourTargetIntoView(el);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

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

  const showSidebarJourney = shouldShowSidebarYourJourney(user.role_names, user.member_onboarding);
  const showTrainingSubmenu = showSidebarJourney && Boolean(user.member_onboarding);
  const canSeeMobilize = canSeeMobilizeNavItem(user.role_names, mobilizeViewerRoles, mobilizeAccessOpts);
  const canAccessMobilize = canAccessMobilizeModule(
    user.role_names,
    mobilizeViewerRoles,
    mobilizeAccessOpts
  );
  const showMobilizeSettings = user.role_names.includes("super_admin");
  const profileHref = mobilizeMemberProfileHref(user.id);

  const resolveNavHref = useCallback(
    (item: NavItem) => (item.href === "__PROFILE__" ? profileHref : item.href),
    [profileHref]
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexShrink: 0, px: 1.25, pt: 1.25, pb: 1.25 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            alignItems: { xs: "center", md: "stretch" },
            gap: { xs: 1, md: 0 },
          }}
        >
          <IconButton
            size="small"
            aria-label={sidebarOpen ? "Hide menu" : "Show menu"}
            data-tour="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{
              color: "primary.main",
              alignSelf: { xs: "center", md: "flex-start" },
              mb: { xs: 0, md: 1.5 },
              borderRadius: 1,
              flexShrink: 0,
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
              flex: { xs: 1, md: "none" },
              width: { xs: "auto", md: "100%" },
              minWidth: 0,
              height: { xs: 40, md: 52 },
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
        {visibleNav.map((item) => {
          const href = resolveNavHref(item);
          const selected = isNavItemSelected({ ...item, href }, pathname);

          // After National overview → Chapters & Groups parent.
          const afterOverview =
            item.href === "/dashboard" && item.module === MODULE_SLUGS.nationalOverview && canSeeMobilize ? (
              <ChaptersGroupsNavGroup
                key="chapters-groups"
                onNavigate={closeMobileDrawer}
                disabled={!canAccessMobilize}
              />
            ) : null;

          // After Profile → Member Journey + People (admin sections).
          const afterProfile =
            item.href === "__PROFILE__" ? (
              <>
                {missionPipelineNav.length > 0 ? (
                  <MissionPipelineNavGroup
                    key="mission-pipeline-group"
                    missionPipelineNav={missionPipelineNav}
                    missionPipelineOpen={missionPipelineOpen}
                    setMissionPipelineOpen={setMissionPipelineOpen}
                    missionPipelineHasActive={missionPipelineHasActive}
                    pathname={pathname}
                    closeMobileDrawer={closeMobileDrawer}
                  />
                ) : null}
                {peopleNav.length > 0 ? (
                  <PeopleNavGroup
                    key="people-group"
                    peopleNav={peopleNav}
                    peopleOpen={peopleOpen}
                    setPeopleOpen={setPeopleOpen}
                    peopleHasActive={peopleHasActive}
                    pathname={pathname}
                    closeMobileDrawer={closeMobileDrawer}
                  />
                ) : null}
              </>
            ) : null;

          if (item.href === "/dashboard/training" && showTrainingSubmenu && user.member_onboarding) {
            return (
              <Box key={item.href} component="span" sx={{ display: "contents" }}>
                <TrainingNavSubmenu
                  snapshot={user.member_onboarding}
                  selectedParent={selected || pathname.startsWith("/dashboard/training/")}
                  onNavigate={closeMobileDrawer}
                  navItemTouchSx={NAV_ITEM_TOUCH_SX}
                  navSelectedSx={NAV_SELECTED_SX}
                />
                {afterOverview}
                {afterProfile}
              </Box>
            );
          }

          if (
            item.module === MODULE_SLUGS.movilization &&
            !canAccessMobilize &&
            item.href !== "__PROFILE__"
          ) {
            // Profile / Feed / Deployment require Mobilize access — hide when blocked.
            // (Chapters & Groups shows disabled separately.)
            return null;
          }

          if (item.href === "__PROFILE__" && !canAccessMobilize) {
            return (
              <Box key="profile-block" component="span" sx={{ display: "contents" }}>
                {afterOverview}
                {afterProfile}
              </Box>
            );
          }

          return (
            <Box key={item.href} component="span" sx={{ display: "contents" }}>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href={href}
                  selected={selected}
                  data-tour={`nav-${item.module}-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
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
                    {item.href === "/dashboard/notifications" ? (
                      <MissionUpdatesNavIcon>{item.icon}</MissionUpdatesNavIcon>
                    ) : (
                      item.icon
                    )}
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
              {afterOverview}
              {afterProfile}
            </Box>
          );
        })}
        {!visibleNav.some((i) => i.href === "/dashboard") && canSeeMobilize ? (
          <ChaptersGroupsNavGroup
            onNavigate={closeMobileDrawer}
            disabled={!canAccessMobilize}
          />
        ) : null}
        {!visibleNav.some((i) => i.href === "__PROFILE__") ? (
          <>
            {missionPipelineNav.length > 0 ? (
              <MissionPipelineNavGroup
                missionPipelineNav={missionPipelineNav}
                missionPipelineOpen={missionPipelineOpen}
                setMissionPipelineOpen={setMissionPipelineOpen}
                missionPipelineHasActive={missionPipelineHasActive}
                pathname={pathname}
                closeMobileDrawer={closeMobileDrawer}
              />
            ) : null}
            {peopleNav.length > 0 ? (
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
        ) : null}
        {settingsNav.length > 0 ? (
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
              <SidebarNestedNavList
                items={settingsNav.map((item) => ({
                  key: item.href,
                  label: item.label,
                  href: item.href,
                  icon: item.icon,
                  selected: isNavItemSelected(item, pathname),
                  tourAttr: `nav-${item.module}`,
                }))}
                onNavigate={closeMobileDrawer}
              />
            </Collapse>
          </>
        ) : null}
        {showMobilizeSettings ? (
          <Suspense fallback={null}>
            <MobilizeSettingsNavGroup onNavigate={closeMobileDrawer} />
          </Suspense>
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
            src={shellAvatarSrc}
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
            {user.training_graduate_badge ? (
              <Box
                sx={{ mt: 0.65, display: "flex", alignItems: "center", gap: 0.35 }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setGraduateCongratsOpen(true)}
                  sx={{
                    p: 0,
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    display: "inline-flex",
                    lineHeight: 0,
                  }}
                  aria-label="View course completion"
                >
                  <CourseGraduateBadge role={user.training_graduate_badge} size="compact" />
                </Box>
                <Tooltip title="About this badge">
                  <IconButton
                    size="small"
                    onClick={() => setGraduateCongratsOpen(true)}
                    aria-label="Badge information"
                    sx={{ color: "rgba(255,255,255,0.7)", p: 0.2 }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : null}
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
    <MissionUpdatesUnreadProvider>
      <Box sx={{ minHeight: "100vh", flex: 1, display: "flex", flexDirection: "column" }}>
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
        <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1, position: "relative" }}>
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
          {!desktop ? (
            <Box
              sx={{
                position: "relative",
                width: 140,
                height: 32,
                flexShrink: 0,
                ml: -0.5,
              }}
            >
              <Image
                src={DASHBOARD_DRAWER_LOGO}
                alt="FlashPoint"
                fill
                sizes="140px"
                style={{ objectFit: "contain", objectPosition: "left center" }}
                priority
                unoptimized
              />
            </Box>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <RoleWelcomeVideoPrompt />
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <DashboardTourHelpButton />
          </Box>
          <Box data-tour="header-notifications" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            {showSystemNotificationBell ? <NotificationMenu userId={user.id} /> : null}
            {/* Profile/social alerts (follows, likes, comments) — members and admins alike. */}
            <UserNotificationsMenu />
          </Box>
          <HeaderSuperAdminProfileAvatar
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
          flex: 1,
          display: "flex",
          flexDirection: "column",
          color: "grey.100",
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </Box>
        <PoweredByDreamsAnimation
          sx={{
            fontSize: "0.65rem",
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid rgba(255,215,0,0.12)",
            flexShrink: 0,
          }}
        />
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
      <GlobalContainerShareItemListener />
    </Box>
    </MissionUpdatesUnreadProvider>
    </DashboardPresenceProvider>
    </DashboardTourProvider>
  );
}
