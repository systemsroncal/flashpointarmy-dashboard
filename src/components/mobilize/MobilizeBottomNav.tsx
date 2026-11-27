"use client";

import { MobilizeBottomNavBar, type MobilizeBottomNavBarItem } from "@/components/mobilize/MobilizeBottomNavBar";
import {
  isMobilizeChaptersNavActive,
  mobilizeChaptersNavItems,
} from "@/lib/mobilize/mobilize-chapters-nav-config";
import {
  isMobilizeSocialNavActive,
  mobilizeSocialNavItems,
  type MobilizeSocialNavKey,
} from "@/lib/mobilize/social/mobilize-social-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import {
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_SOCIAL_SETTINGS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import { mobilizeDarkScrollbarSx } from "@/lib/ui/scrollbar-sx";
import { SIGNING_OUT_SESSION_KEY } from "@/lib/auth/session-policy";
import { createClient } from "@/utils/supabase/client";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, Divider, ListItemIcon } from "@mui/material";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MapIcon from "@mui/icons-material/Map";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { flashpointYellow } from "@/theme/tokens";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";

const SOCIAL_ICONS: Record<MobilizeSocialNavKey, ReactNode> = {
  search: <SearchIcon sx={{ fontSize: 22 }} />,
  home: (
    <Box
      component="img"
      src="/favicon-fp-army.png"
      alt=""
      sx={{ width: 22, height: 22, objectFit: "contain", display: "block" }}
    />
  ),
  alerts: <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />,
  messages: <MailOutlineIcon sx={{ fontSize: 22 }} />,
  groups: <GroupsOutlinedIcon sx={{ fontSize: 22 }} />,
  bookmarks: <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
  profile: <PersonOutlineIcon sx={{ fontSize: 22 }} />,
  settings: <SettingsOutlinedIcon sx={{ fontSize: 22 }} />,
};

const CHAPTERS_ICONS = {
  chapter: <MapIcon sx={{ fontSize: 22 }} />,
  groups: <Groups2OutlinedIcon sx={{ fontSize: 22 }} />,
  activities: <EventAvailableOutlinedIcon sx={{ fontSize: 22 }} />,
  notifications: <NotificationsActiveOutlinedIcon sx={{ fontSize: 22 }} />,
  groupsSettings: <SettingsOutlinedIcon sx={{ fontSize: 22 }} />,
} as const;

type Props = { variant: "social" } | { variant: "chapters" };

function MobilizeBottomNavSearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    members: {
      id: string;
      display_name: string;
      handle: string;
      href: string;
      verified?: boolean;
      verified_at?: string | null;
    }[];
    groups: { id: string; name: string; href: string }[];
  }>({ members: [], groups: [] });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults({ members: [], groups: [] });
    }
  }, [open]);

  async function runSearch(query: string) {
    const q = query.trim();
    if (q.length < 2) {
      setResults({ members: [], groups: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/mobilize/social/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error();
      setResults({ members: json.members ?? [], groups: json.groups ?? [] });
    } catch {
      setResults({ members: [], groups: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>Search</DialogTitle>
      <DialogContent sx={{ ...mobilizeDarkScrollbarSx, maxHeight: "min(70dvh, 520px)", overflowY: "auto" }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search members or groups"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            void runSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch(search);
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />
        {loading ? (
          <Typography variant="caption" color="text.secondary">
            Searching…
          </Typography>
        ) : null}
        {!loading && search.trim().length >= 2 && !results.members.length && !results.groups.length ? (
          <Typography variant="caption" color="text.secondary">
            No results
          </Typography>
        ) : null}
        {results.members.map((m) => (
          <ListItemButton
            key={m.id}
            component={Link}
            href={m.href}
            onClick={onClose}
            sx={{ borderRadius: 1, mb: 0.25 }}
          >
            <ListItemText
              primary={
                <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  {m.display_name}
                  {m.verified ? <VerifiedUserBadge size={15} verifiedAt={m.verified_at ?? null} /> : null}
                </Box>
              }
              secondary={m.handle}
              primaryTypographyProps={{ component: "div" }}
            />
          </ListItemButton>
        ))}
        {results.groups.map((g) => (
          <ListItemButton
            key={g.id}
            component={Link}
            href={g.href}
            onClick={onClose}
            sx={{ borderRadius: 1, mb: 0.25 }}
          >
            <ListItemText primary={g.name} secondary="Group" />
          </ListItemButton>
        ))}
      </DialogContent>
    </Dialog>
  );
}

const SOCIAL_OVERFLOW_ONLY: MobilizeSocialNavKey[] = ["profile", "bookmarks", "settings"];

async function signOutFromMobilizeMenu() {
  try {
    sessionStorage.setItem(SIGNING_OUT_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  try {
    await fetch("/api/auth/session-clear", { method: "POST", credentials: "include" });
  } catch {
    /* ignore */
  }
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}

function MobilizeSocialOverflowMenu({
  close,
  profileHref,
  pathname,
}: {
  close: () => void;
  profileHref: string;
  pathname: string;
}) {
  const profileActive = pathname === profileHref;
  const savedActive = pathname.startsWith(MOBILIZE_BOOKMARKS_HREF);
  const settingsActive = pathname.startsWith(MOBILIZE_SOCIAL_SETTINGS_HREF);
  const [profileOpen, setProfileOpen] = useState(profileActive || savedActive);
  const [settingsOpen, setSettingsOpen] = useState(settingsActive);

  return (
    <Box sx={{ minWidth: 240, py: 0.5 }}>
      <MenuItem
        onClick={() => setProfileOpen((v) => !v)}
        selected={profileActive || savedActive}
        sx={{ color: profileActive || savedActive ? flashpointYellow : "rgba(255,255,255,0.88)", py: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{SOCIAL_ICONS.profile}</ListItemIcon>
        <ListItemText primary="Profile" primaryTypographyProps={{ fontWeight: 700 }} />
        {profileOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </MenuItem>
      <Collapse in={profileOpen} unmountOnExit>
        <MenuItem
          component={Link}
          href={profileHref}
          onClick={close}
          selected={profileActive}
          sx={{ pl: 4.5, py: 0.85, color: profileActive ? flashpointYellow : "rgba(255,255,255,0.82)" }}
        >
          <ListItemText primary="View profile" primaryTypographyProps={{ fontSize: "0.85rem" }} />
        </MenuItem>
        <MenuItem
          component={Link}
          href={MOBILIZE_BOOKMARKS_HREF}
          onClick={close}
          selected={savedActive}
          sx={{ pl: 4.5, py: 0.85, color: savedActive ? flashpointYellow : "rgba(255,255,255,0.82)" }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>{SOCIAL_ICONS.bookmarks}</ListItemIcon>
          <ListItemText primary="My saved" primaryTypographyProps={{ fontSize: "0.85rem" }} />
        </MenuItem>
      </Collapse>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 0.5 }} />
      <MenuItem
        onClick={() => setSettingsOpen((v) => !v)}
        selected={settingsActive}
        sx={{ color: settingsActive ? flashpointYellow : "rgba(255,255,255,0.88)", py: 1 }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{SOCIAL_ICONS.settings}</ListItemIcon>
        <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 700 }} />
        {settingsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </MenuItem>
      <Collapse in={settingsOpen} unmountOnExit>
        <MenuItem
          component={Link}
          href={MOBILIZE_SOCIAL_SETTINGS_HREF}
          onClick={close}
          selected={settingsActive}
          sx={{ pl: 4.5, py: 0.85, color: settingsActive ? flashpointYellow : "rgba(255,255,255,0.82)" }}
        >
          <ListItemText primary="Mobilize settings" primaryTypographyProps={{ fontSize: "0.85rem" }} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            void signOutFromMobilizeMenu();
          }}
          sx={{ pl: 4.5, py: 0.85, color: "rgba(255,255,255,0.42)" }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "rgba(255,255,255,0.42)" }}>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            primaryTypographyProps={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.42)" }}
          />
        </MenuItem>
      </Collapse>
    </Box>
  );
}

function MobilizeSocialBottomNav() {
  const me = useDashboardUser();
  const pathname = usePathname();
  const profileHref = mobilizeMemberProfileHref(me.id);
  const [searchOpen, setSearchOpen] = useState(false);

  const items = useMemo<MobilizeBottomNavBarItem[]>(() => {
    return mobilizeSocialNavItems(profileHref)
      .filter((item) => !SOCIAL_OVERFLOW_ONLY.includes(item.key))
      .map((item) => {
      const active =
        item.key === "search"
          ? searchOpen
          : isMobilizeSocialNavActive(item.key, pathname, profileHref);
      return {
        key: item.key,
        label: item.label,
        shortLabel: item.shortLabel,
        href: item.key === "search" ? undefined : item.href,
        onClick: item.key === "search" ? () => setSearchOpen(true) : undefined,
        icon: SOCIAL_ICONS[item.key],
        active,
      };
    });
  }, [pathname, profileHref, searchOpen]);

  return (
    <>
      <MobilizeBottomNavSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobilizeBottomNavBar
        items={items}
        ariaLabel="Mobilize social navigation"
        renderOverflowMenu={(close) => (
          <MobilizeSocialOverflowMenu close={close} profileHref={profileHref} pathname={pathname} />
        )}
      />
    </>
  );
}

function MobilizeChaptersBottomNav() {
  const me = useDashboardUser();
  const pathname = usePathname();
  const showGroupsSettings = me.role_names.includes("super_admin");
  const showNotifications =
    me.role_names.includes("super_admin") ||
    me.role_names.includes("admin") ||
    me.role_names.includes("sub_admin");

  const items = useMemo<MobilizeBottomNavBarItem[]>(() => {
    return mobilizeChaptersNavItems(showGroupsSettings, showNotifications).map((item) => ({
      key: item.key,
      label: item.label,
      shortLabel: item.shortLabel,
      href: item.href,
      icon: CHAPTERS_ICONS[item.key],
      active: isMobilizeChaptersNavActive(item.key, pathname),
    }));
  }, [pathname, showGroupsSettings, showNotifications]);

  return <MobilizeBottomNavBar items={items} ariaLabel="Mobilize chapters navigation" borderAccent="gold" />;
}

export function MobilizeBottomNav(props: Props) {
  if (props.variant === "chapters") {
    return <MobilizeChaptersBottomNav />;
  }
  return <MobilizeSocialBottomNav />;
}
