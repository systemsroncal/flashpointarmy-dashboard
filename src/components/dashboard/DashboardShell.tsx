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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { MissionUpdatesNavIcon } from "./MissionUpdatesNavIcon";
import { MobilizeVideoCamIcon } from "@/components/mobilize/MobilizeVideoCamIcon";
import { WelcomeVideoPopup } from "@/components/mobilize/WelcomeVideoPopup";
import { MissionUpdatesUnreadProvider } from "./MissionUpdatesUnreadProvider";
import { HeaderSuperAdminProfileAvatar } from "./HeaderSuperAdminProfileAvatar";
import { DashboardGlobalSearch } from "./DashboardGlobalSearch";
import { MobileDrawerAccountSection } from "./MobileDrawerAccountSection";
import { GlobalContainerShareItemListener } from "./GlobalContainerShareItemListener";
import { NotificationMenu } from "./NotificationMenu";
import { FirstLoginPasswordGate } from "./FirstLoginPasswordGate";
import { NotificationsDrawerUnreadCount } from "./NotificationsDrawerUnreadCount";
import { RoleWelcomeVideoPrompt } from "./RoleWelcomeVideoPrompt";
import { SidebarYourJourney } from "./SidebarYourJourney";
import { SidebarNestedNavList } from "./SidebarNestedNavList";
import { ChaptersGroupsNavGroup } from "./ChaptersGroupsNavGroup";
import { MobilizeSettingsNavGroup } from "./MobilizeSettingsNavGroup";
import { ChapterInviteShareDialog } from "./national-overview/ChapterInviteShareDialog";
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
import { resolveMobilizeMobileBackHref } from "@/lib/mobilize/mobilize-mobile-back-href";
import { resolveMobilizeMobileHeaderTitle } from "@/lib/mobilize/mobilize-mobile-header-title";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { subscribeProfileDrawerOpen } from "@/lib/user/profile-drawer-events";
import { useMobilizeScrollHide } from "@/lib/mobilize/social/use-mobilize-scroll-hide";
import {
  useMobilizeHeaderOnLightSurface,
  type MobilizeHeaderSurfaceMode,
} from "@/lib/mobilize/social/use-mobilize-header-surface";
import { SOCIAL_HUB_LIGHT_BG, TRUTH_HUB_TEXT } from "@/lib/mobilize/social/social-hub-surface";
import { mobilizeDarkScrollbarSx } from "@/lib/ui/scrollbar-sx";
import {
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_SOCIAL_SETTINGS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

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
    label: "Find Groups",
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
    label: "Deployments",
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
    label: "Feed",
    href: MOBILIZE_HOME_HREF,
    module: MODULE_SLUGS.movilization,
    icon: <HomeOutlinedIcon />,
  },
  {
    label: "National Map",
    href: "/dashboard",
    module: MODULE_SLUGS.nationalOverview,
    icon: <DashboardOutlinedIcon />,
  },
  // Groups is rendered as ChaptersGroupsNavGroup (not a flat link).
  {
    label: "Training",
    href: "/dashboard/training",
    module: MODULE_SLUGS.training,
    icon: <SchoolIcon />,
  },
  {
    label: "Deployments",
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
  const [mobilizeProfileNavOpen, setMobilizeProfileNavOpen] = useState(false);
  const [missionPipelineOpen, setMissionPipelineOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [inviteShareOpen, setInviteShareOpen] = useState(false);
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null);
  const [liveAvatarNonce, setLiveAvatarNonce] = useState(0);
  const pathname = usePathname();
  const permissions = usePermissions();
  const user = useDashboardUser();

  useEffect(() => {
    return subscribeProfileDrawerOpen((detail) => {
      if (detail.edit) setProfileEditMode(true);
      setProfileOpen(true);
    });
  }, []);

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
  const onMobilizeGroupDetailPage =
    isMobilize && /^\/dashboard\/mobilize\/groups\/[^/]+/.test(pathname);
  const mobilizeMobileSlimHeader = !desktop && isMobilize;
  const mobilizeMobileChrome = mobilizeMobileSlimHeader;
  const mobilizeMobileLayout = !desktop && isMobilize;
  const mobilizeTransparentAppBar = mobilizeMobileLayout;
  const mobilizeHeaderHidden = useMobilizeScrollHide(mobilizeMobileChrome);
  const [mobilizeBackHref, setMobilizeBackHref] = useState("/dashboard/mobilize/home");

  useEffect(() => {
    if (!mobilizeMobileSlimHeader) return;
    setMobilizeBackHref(
      resolveMobilizeMobileBackHref(pathname, new URLSearchParams(window.location.search))
    );
  }, [mobilizeMobileSlimHeader, pathname]);
  const onMobilizeSocialHubPage =
    isMobilize &&
    (pathname === `${MOBILIZE_PREFIX}/home` ||
      pathname === MOBILIZE_PREFIX ||
      onMobilizeProfilePage ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/bookmarks`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/alerts`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/messages`) ||
      pathname.startsWith(`${MOBILIZE_PREFIX}/social-settings`));

  const mobilizeHeaderSurfaceMode: MobilizeHeaderSurfaceMode =
    onMobilizeProfilePage || onMobilizeGroupDetailPage ? "cover-hero" : "light";
  const mobilizeMobileHubTitle = useMemo(
    () => resolveMobilizeMobileHeaderTitle(pathname),
    [pathname]
  );
  const mobilizeMobileTitleHeader =
    mobilizeMobileChrome && mobilizeMobileHubTitle !== null;
  const mobilizeAppBarTransparent =
    mobilizeTransparentAppBar && !mobilizeMobileTitleHeader;
  const mobilizeHeroOverlayToolbar =
    mobilizeMobileChrome &&
    mobilizeHeaderSurfaceMode === "cover-hero" &&
    !mobilizeMobileTitleHeader;
  const mobilizeContentUnderHeader = mobilizeHeroOverlayToolbar;
  /** Icons dark on #f0f2f5 / white; light over profile & group cover heroes until scroll. */
  const mobilizeHeaderOnLightSurface = useMobilizeHeaderOnLightSurface(
    mobilizeMobileChrome && !mobilizeMobileTitleHeader,
    mobilizeHeaderSurfaceMode
  );
  const mobilizeToolbarOnLightSurface =
    mobilizeMobileTitleHeader || mobilizeHeaderOnLightSurface;

  useEffect(() => {
    if (desktop) setDesktopDrawerOpen(true);
  }, [desktop]);

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
  const drawerDisplayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
    user.display_name?.trim() ||
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

  useEffect(() => {
    if (
      pathname === profileHref ||
      pathname.startsWith(MOBILIZE_BOOKMARKS_HREF) ||
      pathname.startsWith(`${profileHref}/`)
    ) {
      setMobilizeProfileNavOpen(true);
    }
  }, [pathname, profileHref]);

  useEffect(() => {
    if (pathname.startsWith(MOBILIZE_SOCIAL_SETTINGS_HREF)) {
      setSettingsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (profileOpen) setMobilizeProfileNavOpen(true);
  }, [profileOpen]);

  const mobilizeSocialSettingsActive = pathname.startsWith(MOBILIZE_SOCIAL_SETTINGS_HREF);
  const mobilizeSettingsSectionActive = settingsHasActive || mobilizeSocialSettingsActive;

  const resolveNavHref = useCallback(
    (item: NavItem) => (item.href === "__PROFILE__" ? profileHref : item.href),
    [profileHref]
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexShrink: 0, px: 1.25, pt: { xs: 0.75, md: 1.25 }, pb: { xs: 0.75, md: 1.25 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            alignItems: { xs: "center", md: "stretch" },
            gap: { xs: 1, md: 0 },
          }}
        >
          {!sidebarOpen ? (
            <IconButton
              size="small"
              aria-label="Show menu"
              data-tour="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                color: "primary.main",
                alignSelf: { xs: "center", md: "flex-start" },
                mb: { xs: 0, md: 1.5 },
                borderRadius: 1,
                flexShrink: 0,
              }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          ) : null}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "relative",
              flex: { xs: 1, md: "none" },
              width: { xs: "auto", md: "100%" },
              minWidth: 0,
              height: { xs: 52, md: 60 },
              borderRadius: 1.5,
              overflow: "hidden",
              bgcolor: "rgba(0,0,0,0.35)",
              px: { xs: 1, md: 0.75 },
              py: { xs: 0.65, md: 0.35 },
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
      {!desktop ? (
        <>
          <MobileDrawerAccountSection
            shellAvatarSrc={shellAvatarSrc}
            displayName={drawerDisplayName}
            profileHref={profileHref}
            onNavigate={closeMobileDrawer}
          />
          <Divider sx={{ borderColor: "rgba(255,215,0,0.2)" }} />
        </>
      ) : null}
      <List
        sx={{
          flex: 1,
          minHeight: 0,
          py: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          ...mobilizeDarkScrollbarSx,
        }}
        data-tour="sidebar-nav-scroll"
      >
        {visibleNav.map((item) => {
          const href = resolveNavHref(item);
          const selected = isNavItemSelected({ ...item, href }, pathname);

          // After National Map → Groups parent.
          const afterOverview =
            item.href === "/dashboard" && item.module === MODULE_SLUGS.nationalOverview && canSeeMobilize ? (
              <ChaptersGroupsNavGroup
                key="chapters-groups"
                onNavigate={closeMobileDrawer}
                disabled={!canAccessMobilize}
              />
            ) : null;

          const mobileDrawerProfileMenu =
            !desktop && canAccessMobilize && item.href === "__PROFILE__";
          const profileSectionActive =
            pathname === profileHref ||
            pathname.startsWith(`${profileHref}/`) ||
            pathname.startsWith(MOBILIZE_BOOKMARKS_HREF) ||
            profileOpen;
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
            // Profile / Feed / Deployments require Mobilize access — hide when blocked.
            // (Groups shows disabled separately.)
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

          if (mobileDrawerProfileMenu) {
            return (
              <Box key={item.href} component="span" sx={{ display: "contents" }}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setMobilizeProfileNavOpen((prev) => !prev)}
                    selected={profileSectionActive}
                    sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.75 }}
                  >
                    <ListItemIcon
                      sx={{
                        color: profileSectionActive ? "primary.main" : "rgba(255,255,255,0.92)",
                        minWidth: 38,
                      }}
                    >
                      <PersonOutlineIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profile"
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                        fontSize: "calc(0.82rem + 3px)",
                        color: profileSectionActive ? "primary.main" : "rgba(255,255,255,0.88)",
                      }}
                    />
                    {mobilizeProfileNavOpen ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse in={mobilizeProfileNavOpen} timeout="auto" unmountOnExit>
                  <ListItem disablePadding sx={{ pl: 2.25, pr: 1 }}>
                    <ListItemButton
                      component={Link}
                      href={profileHref}
                      selected={pathname === profileHref || pathname.startsWith(`${profileHref}/`)}
                      onClick={closeMobileDrawer}
                      sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.65, pl: 1.5, borderRadius: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: "rgba(255,255,255,0.88)" }}>
                        <PersonOutlineIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="My profile"
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color:
                            pathname === profileHref || pathname.startsWith(`${profileHref}/`)
                              ? "primary.main"
                              : "rgba(255,255,255,0.88)",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding sx={{ pl: 2.25, pr: 1 }}>
                    <ListItemButton
                      component={Link}
                      href={MOBILIZE_BOOKMARKS_HREF}
                      selected={pathname.startsWith(MOBILIZE_BOOKMARKS_HREF)}
                      onClick={closeMobileDrawer}
                      sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.65, pl: 1.5, borderRadius: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: "rgba(255,255,255,0.88)" }}>
                        <BookmarkBorderOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="My saved"
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color: pathname.startsWith(MOBILIZE_BOOKMARKS_HREF)
                            ? "primary.main"
                            : "rgba(255,255,255,0.88)",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding sx={{ pl: 2.25, pr: 1 }}>
                    <ListItemButton
                      selected={profileOpen}
                      onClick={() => {
                        closeMobileDrawer();
                        setProfileEditMode(false);
                        setProfileOpen(true);
                      }}
                      sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.65, pl: 1.5, borderRadius: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 34, color: "rgba(255,255,255,0.88)" }}>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Settings"
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          color: profileOpen ? "primary.main" : "rgba(255,255,255,0.88)",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Collapse>
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
        {!desktop &&
        (settingsNav.length > 0 || canAccessMobilize || showMobilizeSettings) ? (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSettingsOpen((prev) => !prev)}
                selected={mobilizeSettingsSectionActive}
                data-tour="nav-settings-group"
                sx={{
                  ...NAV_ITEM_TOUCH_SX,
                  py: 0.75,
                  "&.Mui-selected": NAV_SELECTED_SX,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: mobilizeSettingsSectionActive
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
                    color: mobilizeSettingsSectionActive
                      ? "primary.main"
                      : "rgba(255,255,255,0.88)",
                  }}
                />
                {settingsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </ListItemButton>
            </ListItem>
            <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
              {settingsNav.length > 0 ? (
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
              ) : null}
              {canAccessMobilize ? (
                <ListItem disablePadding sx={{ pl: 2.25, pr: 1 }}>
                  <ListItemButton
                    component={Link}
                    href={MOBILIZE_SOCIAL_SETTINGS_HREF}
                    selected={mobilizeSocialSettingsActive}
                    onClick={closeMobileDrawer}
                    sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.65, pl: 1.5, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary="Mobilize settings"
                      primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: mobilizeSocialSettingsActive
                          ? "primary.main"
                          : "rgba(255,255,255,0.88)",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ) : null}
              {showMobilizeSettings ? (
                <Suspense fallback={null}>
                  <MobilizeSettingsNavGroup onNavigate={closeMobileDrawer} />
                </Suspense>
              ) : null}
              <ListItem disablePadding sx={{ pl: 2.25, pr: 1 }}>
                <ListItemButton
                  onClick={() => {
                    closeMobileDrawer();
                    void handleSignOut();
                  }}
                  sx={{ ...NAV_ITEM_TOUCH_SX, py: 0.65, pl: 1.5, borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: "rgba(255,255,255,0.88)" }}>
                    <LogoutOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Log out"
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </Collapse>
          </>
        ) : settingsNav.length > 0 && desktop ? (
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
                    color: settingsHasActive ? "primary.main" : "rgba(255,255,255,0.92)",
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
                    color: settingsHasActive ? "primary.main" : "rgba(255,255,255,0.88)",
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
        {showMobilizeSettings && desktop ? (
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
            fullWidth
            variant="contained"
            startIcon={<GroupsIcon />}
            onClick={() => {
              closeMobileDrawer();
              setInviteShareOpen(true);
            }}
            sx={{
              fontWeight: 800,
              color: "#0a0a0a",
              bgcolor: "primary.main",
              borderRadius: 2,
              py: 1.1,
              minHeight: 44,
              touchAction: "manipulation",
              textTransform: "none",
              "&:hover": { bgcolor: "primary.light" },
            }}
          >
            Invite Friends
          </Button>
        </Box>
      ) : null}
      <Box sx={{ flexShrink: 0, display: { xs: "none", md: "block" } }}>
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
        position={
          mobilizeMobileTitleHeader ? "fixed" : mobilizeMobileChrome ? "absolute" : "fixed"
        }
        elevation={0}
        color={mobilizeMobileTitleHeader ? "default" : mobilizeAppBarTransparent ? "transparent" : "default"}
        enableColorOnDark={mobilizeAppBarTransparent}
        sx={{
          top: maintenanceTop,
          zIndex: (t) => t.zIndex.drawer + 1,
          ...(mobilizeMobileTitleHeader
            ? {
                bgcolor: "#fff",
                color: "#0d0d0d",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "none",
              }
            : mobilizeAppBarTransparent
              ? {
                  bgcolor: "transparent",
                  backgroundColor: "transparent",
                  background: "transparent",
                  backgroundImage: "none",
                  boxShadow: "none",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none",
                  borderBottom: "none",
                  "&.MuiAppBar-root": {
                    backgroundColor: "transparent",
                    backgroundImage: "none",
                    boxShadow: "none",
                  },
                  "&.MuiAppBar-colorDefault": {
                    backgroundColor: "transparent",
                  },
                  "&.MuiPaper-root": {
                    backgroundColor: "transparent",
                    backgroundImage: "none",
                    boxShadow: "none",
                  },
                }
              : {
                  bgcolor: "rgba(12,12,14,0.88)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  borderBottom: "1px solid rgba(255,215,0,0.12)",
                }),
          width: { xs: "100%", md: `calc(100% - ${appBarShift}px)` },
          ml: { md: `${appBarShift}px` },
          color: mobilizeMobileTitleHeader
            ? "#0d0d0d"
            : mobilizeAppBarTransparent
              ? mobilizeToolbarOnLightSurface
                ? "#0d0d0d"
                : "#fff"
              : undefined,
          transform: mobilizeMobileChrome && mobilizeHeaderHidden ? "translateY(-110%)" : "translate3d(0, 0, 0)",
          WebkitTransform: mobilizeMobileChrome && mobilizeHeaderHidden ? "translateY(-110%)" : "translate3d(0, 0, 0)",
          willChange: "transform",
          transition: mobilizeMobileChrome
            ? theme.transitions.create(["transform", "width", "margin", "color"], {
                easing: theme.transitions.easing.easeInOut,
                duration: 220,
              })
            : theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          "& .MuiIconButton-root": mobilizeMobileTitleHeader
            ? {
                color: "rgba(0,0,0,0.88)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
              }
            : mobilizeAppBarTransparent
            ? mobilizeHeroOverlayToolbar
              ? {
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  flexShrink: 0,
                  color: mobilizeHeaderOnLightSurface ? "#0d0d0d" : "#fff",
                  bgcolor: mobilizeHeaderOnLightSurface
                    ? "rgba(255,255,255,0.96)"
                    : "rgba(0,0,0,0.42)",
                  boxShadow: mobilizeHeaderOnLightSurface
                    ? "0 1px 3px rgba(0,0,0,0.14)"
                    : "0 1px 5px rgba(0,0,0,0.38)",
                  backdropFilter: mobilizeHeaderOnLightSurface ? "none" : "blur(8px)",
                  WebkitBackdropFilter: mobilizeHeaderOnLightSurface ? "none" : "blur(8px)",
                  transition: theme.transitions.create(["color", "background-color", "box-shadow"], {
                    duration: 200,
                    easing: theme.transitions.easing.easeInOut,
                  }),
                  "&:hover": {
                    bgcolor: mobilizeHeaderOnLightSurface
                      ? "#fff"
                      : "rgba(0,0,0,0.55)",
                  },
                }
              : {
                  color: mobilizeHeaderOnLightSurface ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.95)",
                  transition: theme.transitions.create(["color"], {
                    duration: 180,
                    easing: theme.transitions.easing.easeInOut,
                  }),
                  "&:hover": {
                    bgcolor: mobilizeHeaderOnLightSurface
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(255,255,255,0.12)",
                  },
                }
            : undefined,
          "& .MuiBadge-root .MuiSvgIcon-root": mobilizeMobileTitleHeader
            ? { color: "rgba(0,0,0,0.88)" }
            : mobilizeAppBarTransparent
            ? {
                color: mobilizeToolbarOnLightSurface ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.95)",
                transition: theme.transitions.create(["color"], {
                  duration: 180,
                  easing: theme.transitions.easing.easeInOut,
                }),
              }
            : undefined,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: { xs: 52, md: 48 },
            py: { xs: 0.35, md: 0 },
            gap: mobilizeHeroOverlayToolbar ? 0.5 : mobilizeMobileTitleHeader ? 0.75 : 1,
            px: mobilizeHeroOverlayToolbar
              ? { xs: 1, sm: 1.5 }
              : mobilizeMobileTitleHeader
                ? { xs: 1, sm: 1.5 }
                : undefined,
            position: "relative",
            bgcolor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
          }}
        >
          {mobilizeMobileTitleHeader ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Menu"
              sx={{ mr: 0.25 }}
            >
              <MenuIcon />
            </IconButton>
          ) : mobilizeMobileSlimHeader ? (
            <IconButton
              color="inherit"
              edge="start"
              component={Link}
              href={mobilizeBackHref}
              aria-label="Back"
            >
              <ArrowBackIcon />
            </IconButton>
          ) : !desktop && !mobileDrawerOpen ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Menu"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          {!desktop && !mobilizeMobileSlimHeader ? (
            <Box
              sx={{
                position: "relative",
                width: 220,
                height: 50,
                flexShrink: 0,
                ml: -0.5,
              }}
            >
              <Image
                src={DASHBOARD_DRAWER_LOGO}
                alt="FlashPoint"
                fill
                sizes="220px"
                style={{ objectFit: "contain", objectPosition: "left center" }}
                priority
                unoptimized
              />
            </Box>
          ) : null}
          {mobilizeMobileTitleHeader ? (
            <Typography
              component="h1"
              variant="h6"
              noWrap
              sx={{
                flex: 1,
                minWidth: 0,
                fontWeight: 800,
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "inherit",
              }}
            >
              {mobilizeMobileHubTitle}
            </Typography>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}
          {canAccessMobilize ? (
            <DashboardGlobalSearch lightSurface={mobilizeToolbarOnLightSurface} />
          ) : null}
          <Box
            sx={{
              display: {
                xs: mobilizeHeroOverlayToolbar ? "none" : "inline-flex",
                md: "inline-flex",
              },
            }}
          >
            <RoleWelcomeVideoPrompt />
          </Box>
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <MobilizeVideoCamIcon />
          </Box>
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <DashboardTourHelpButton />
          </Box>
          <Box data-tour="header-notifications" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
            {showSystemNotificationBell ? <NotificationMenu userId={user.id} /> : null}
            {/* Profile/social alerts (follows, likes, comments) — members and admins alike. */}
            <UserNotificationsMenu />
          </Box>
          <Box sx={{ display: { xs: "none", md: "inline-flex" } }}>
            <HeaderSuperAdminProfileAvatar
              onOpenProfile={() => setProfileOpen(true)}
              onSignOut={() => void handleSignOut()}
            />
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
                  position: "fixed",
                  top: maintenanceTop,
                  ...drawerViewportHeightCss(maintenanceTop),
                },
              }
            : {
                width: "80vw",
                maxWidth: "80vw",
                [`& .MuiDrawer-paper`]: {
                  ...drawerPaperSx(theme),
                  width: "80vw",
                  maxWidth: "80vw",
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
          pt: mobilizeContentUnderHeader
            ? 0
            : mobilizeMobileChrome
              ? `calc(52px + ${maintenanceTop})`
              : `calc(${theme.spacing(7)} + ${maintenanceTop})`,
          mt: mobilizeContentUnderHeader ? maintenanceTop : 0,
          px: isMobilize ? { xs: 0, sm: 2, md: 3 } : { xs: 2, sm: 3 },
          pb: isMobilize
            ? "calc(56px + 32px + env(safe-area-inset-bottom, 0px))"
            : "calc(32px + env(safe-area-inset-bottom, 0px))",
          ml: { md: desktopDrawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          minHeight: "100vh",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          ...(mobilizeMobileLayout
            ? {
                bgcolor: SOCIAL_HUB_LIGHT_BG,
                color: "#0d0d0d",
              }
            : isMobilize
              ? { bgcolor: SOCIAL_HUB_LIGHT_BG, color: "#0d0d0d" }
              : { color: "grey.100" }),
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <ImpersonationBanner />
          {children}
        </Box>
        <PoweredByDreamsAnimation
          sx={{
            display: mobilizeMobileChrome ? "none" : "block",
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

      <ChapterInviteShareDialog
        open={inviteShareOpen}
        onClose={() => setInviteShareOpen(false)}
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
      <WelcomeVideoPopup />
    </Box>
    </MissionUpdatesUnreadProvider>
    </DashboardPresenceProvider>
    </DashboardTourProvider>
  );
}
