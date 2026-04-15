"use client";

import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import GroupsIcon from "@mui/icons-material/Groups";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";
import SchoolIcon from "@mui/icons-material/School";
import SecurityIcon from "@mui/icons-material/Security";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmailIcon from "@mui/icons-material/Email";
import {
  AppBar,
  Avatar,
  Box,
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
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DASHBOARD_DRAWER_LOGO } from "@/config/login";
import { MODULE_SLUGS } from "@/config/modules";
import { isNavModuleAllowedForRoles } from "@/lib/auth/nav-access";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { can } from "@/types/permissions";
import { createClient } from "@/utils/supabase/client";
import { NotificationMenu } from "./NotificationMenu";
import { UserProfileDrawer } from "./UserProfileDrawer";

const DRAWER_WIDTH = 220;

type NavItem = {
  label: string;
  href: string;
  module: string;
  icon: React.ReactNode;
};

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
    label: "Community",
    href: "/dashboard/community",
    module: MODULE_SLUGS.community,
    icon: <PeopleIcon />,
  },
  {
    label: "Gatherings",
    href: "/dashboard/gatherings",
    module: MODULE_SLUGS.gatherings,
    icon: <EventIcon />,
  },
  {
    label: "Leaders",
    href: "/dashboard/leaders",
    module: MODULE_SLUGS.leaders,
    icon: <MilitaryTechIcon />,
  },
  {
    label: "Training",
    href: "/dashboard/training",
    module: MODULE_SLUGS.training,
    icon: <SchoolIcon />,
  },
  {
    label: "Communications",
    href: "/dashboard/communications",
    module: MODULE_SLUGS.communications,
    icon: <CampaignIcon />,
  },
  {
    label: "Growth",
    href: "/dashboard/growth",
    module: MODULE_SLUGS.growth,
    icon: <TrendingUpIcon />,
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const permissions = usePermissions();
  const user = useDashboardUser();

  const sidebarOpen = desktop ? desktopDrawerOpen : mobileDrawerOpen;
  const setSidebarOpen = desktop ? setDesktopDrawerOpen : setMobileDrawerOpen;

  const visibleNav = NAV.filter((item) => {
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
      <List sx={{ flex: 1, py: 1, overflowY: "auto" }}>
        {visibleNav.map((item) => {
          const selected =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={selected}
                onClick={() => !desktop && setMobileDrawerOpen(false)}
                sx={{
                  py: 0.75,
                  "&.Mui-selected": {
                    borderLeft: "3px solid",
                    borderColor: "primary.main",
                    bgcolor: "rgba(255,215,0,0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: "primary.main", minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 600, fontSize: "0.82rem" }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box
        sx={{
          p: 1.5,
          cursor: "pointer",
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
          <Avatar src={user.avatar_url ?? undefined} sx={{ width: 40, height: 40, bgcolor: "primary.dark" }}>
            {displayInitial.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.primary" noWrap fontWeight={600}>
              {displayInitial}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {user.email}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={(e) => {
            e.stopPropagation();
            void handleSignOut();
          }}
          sx={{ mt: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 38 }}>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ variant: "body2" }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  const appBarShift = desktop && desktopDrawerOpen ? DRAWER_WIDTH : 0;

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
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
          <NotificationMenu userId={user.id} />
        </Toolbar>
      </AppBar>

      <Drawer
        variant={desktop ? "persistent" : "temporary"}
        open={desktop ? desktopDrawerOpen : mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          flexShrink: 0,
          ...(desktop
            ? {
                width: DRAWER_WIDTH,
                [`& .MuiDrawer-paper`]: {
                  ...drawerPaperSx(theme),
                  position: "fixed",
                  height: "100%",
                },
              }
            : {
                [`& .MuiDrawer-paper`]: drawerPaperSx(theme),
              }),
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          pt: 7,
          px: { xs: 2, sm: 3 },
          pb: 4,
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

      <UserProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </Box>
  );
}
