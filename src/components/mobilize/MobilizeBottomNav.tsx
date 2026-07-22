"use client";

import { MobilizeBottomNavBar, type MobilizeBottomNavBarItem } from "@/components/mobilize/MobilizeBottomNavBar";
import {
  MOBILIZE_GROUP_TAB_LABELS,
  canViewMobilizeGroupReports,
  mobilizeGroupDetailHref,
  mobilizeGroupTabsForNav,
  type MobilizeGroupTabSlug,
} from "@/lib/mobilize/group-detail-tabs";
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
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MapIcon from "@mui/icons-material/Map";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";

const SOCIAL_ICONS: Record<MobilizeSocialNavKey, ReactNode> = {
  search: <SearchIcon sx={{ fontSize: 22 }} />,
  home: <HomeOutlinedIcon sx={{ fontSize: 22 }} />,
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

const GROUP_TAB_ICONS: Record<MobilizeGroupTabSlug, ReactNode> = {
  announcements: <CampaignOutlinedIcon sx={{ fontSize: 22 }} />,
  events: <EventAvailableOutlinedIcon sx={{ fontSize: 22 }} />,
  members: <GroupsOutlinedIcon sx={{ fontSize: 22 }} />,
  resources: <FolderOpenOutlinedIcon sx={{ fontSize: 22 }} />,
  updates: <NotificationsActiveOutlinedIcon sx={{ fontSize: 22 }} />,
  reports: <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />,
};

const GROUP_TAB_SHORT_LABELS: Record<MobilizeGroupTabSlug, string> = {
  announcements: "Feed",
  events: "Events",
  members: "Members",
  resources: "Resources",
  updates: "Updates",
  reports: "Reports",
};

type SocialProps = { variant: "social" };
type ChaptersProps = { variant: "chapters" };
type GroupProps = {
  variant: "group";
  groupId: string;
  activeTab: MobilizeGroupTabSlug;
};

type Props = SocialProps | ChaptersProps | GroupProps;

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
    members: { id: string; display_name: string; handle: string; href: string }[];
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
      <DialogContent>
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
            <ListItemText primary={m.display_name} secondary={m.handle} />
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

function MobilizeSocialBottomNav() {
  const me = useDashboardUser();
  const pathname = usePathname();
  const profileHref = mobilizeMemberProfileHref(me.id);
  const [searchOpen, setSearchOpen] = useState(false);

  const items = useMemo<MobilizeBottomNavBarItem[]>(() => {
    return mobilizeSocialNavItems(profileHref).map((item) => {
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
      <MobilizeBottomNavBar items={items} ariaLabel="Mobilize social navigation" />
    </>
  );
}

function MobilizeChaptersBottomNav() {
  const me = useDashboardUser();
  const pathname = usePathname();
  const showGroupsSettings = me.role_names.includes("super_admin");

  const items = useMemo<MobilizeBottomNavBarItem[]>(() => {
    return mobilizeChaptersNavItems(showGroupsSettings).map((item) => ({
      key: item.key,
      label: item.label,
      shortLabel: item.shortLabel,
      href: item.href,
      icon: CHAPTERS_ICONS[item.key],
      active: isMobilizeChaptersNavActive(item.key, pathname),
    }));
  }, [pathname, showGroupsSettings]);

  return <MobilizeBottomNavBar items={items} ariaLabel="Mobilize chapters navigation" borderAccent="gold" />;
}

function MobilizeGroupBottomNav({
  groupId,
  activeTab,
}: {
  groupId: string;
  activeTab: MobilizeGroupTabSlug;
}) {
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

  const items = useMemo<MobilizeBottomNavBarItem[]>(() => {
    return mobilizeGroupTabsForNav(canViewReports).map((slug) => ({
      key: slug,
      label: MOBILIZE_GROUP_TAB_LABELS[slug],
      shortLabel: GROUP_TAB_SHORT_LABELS[slug],
      href: mobilizeGroupDetailHref(groupId, slug),
      icon: GROUP_TAB_ICONS[slug],
      active: activeTab === slug,
    }));
  }, [activeTab, canViewReports, groupId]);

  return (
    <MobilizeBottomNavBar items={items} ariaLabel="Group navigation" borderAccent="gold" />
  );
}

export function MobilizeBottomNav(props: Props) {
  if (props.variant === "group") {
    return <MobilizeGroupBottomNav groupId={props.groupId} activeTab={props.activeTab} />;
  }
  if (props.variant === "chapters") {
    return <MobilizeChaptersBottomNav />;
  }
  return <MobilizeSocialBottomNav />;
}
