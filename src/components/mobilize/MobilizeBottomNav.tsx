"use client";

import {
  MOBILIZE_GROUP_TAB_LABELS,
  canViewMobilizeGroupReports,
  mobilizeGroupDetailHref,
  mobilizeGroupTabsForNav,
  type MobilizeGroupTabSlug,
} from "@/lib/mobilize/group-detail-tabs";
import {
  isMobilizeSocialNavActive,
  mobilizeSocialNavItems,
  type MobilizeSocialNavKey,
} from "@/lib/mobilize/social/mobilize-social-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { flashpointYellow } from "@/theme/tokens";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";

export { MOBILIZE_BOTTOM_NAV_HEIGHT_PX };

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

type SocialProps = {
  variant: "social";
};

type GroupProps = {
  variant: "group";
  groupId: string;
  activeTab: MobilizeGroupTabSlug;
};

type Props = SocialProps | GroupProps;

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
  const items = useMemo(() => mobilizeSocialNavItems(profileHref), [profileHref]);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <MobilizeBottomNavSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Box
        component="nav"
        aria-label="Mobilize social navigation"
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          height: MOBILIZE_BOTTOM_NAV_HEIGHT_PX,
          pb: "env(safe-area-inset-bottom, 0px)",
          bgcolor: "rgba(8,8,8,0.96)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((item) => {
          const active =
            item.key === "search" ? searchOpen : isMobilizeSocialNavActive(item.key, pathname, profileHref);
          const label = item.shortLabel ?? item.label;

          if (item.key === "search") {
            return (
              <IconButton
                key={item.key}
                aria-label={item.label}
                onClick={() => setSearchOpen(true)}
                sx={{
                  flex: "1 0 64px",
                  minWidth: 64,
                  maxWidth: 88,
                  flexDirection: "column",
                  gap: 0.25,
                  borderRadius: 0,
                  color: active ? flashpointYellow : "rgba(255,255,255,0.62)",
                  py: 0.75,
                }}
              >
                {SOCIAL_ICONS[item.key]}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontSize: "0.62rem", lineHeight: 1.1, fontWeight: active ? 700 : 500 }}
                >
                  {label}
                </Typography>
              </IconButton>
            );
          }

          return (
            <IconButton
              key={item.key}
              component={Link}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              sx={{
                flex: "1 0 64px",
                minWidth: 64,
                maxWidth: 88,
                flexDirection: "column",
                gap: 0.25,
                borderRadius: 0,
                color: active ? flashpointYellow : "rgba(255,255,255,0.62)",
                py: 0.75,
                textDecoration: "none",
              }}
            >
              {SOCIAL_ICONS[item.key]}
              <Typography
                component="span"
                variant="caption"
                sx={{ fontSize: "0.62rem", lineHeight: 1.1, fontWeight: active ? 700 : 500 }}
              >
                {label}
              </Typography>
            </IconButton>
          );
        })}
      </Box>
    </>
  );
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

  const slugs = mobilizeGroupTabsForNav(canViewReports);

  return (
    <Box
      component="nav"
      aria-label="Group navigation"
      sx={{
        display: { xs: "flex", lg: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        height: MOBILIZE_BOTTOM_NAV_HEIGHT_PX,
        pb: "env(safe-area-inset-bottom, 0px)",
        bgcolor: "rgba(8,8,8,0.96)",
        borderTop: "1px solid rgba(255,215,0,0.18)",
        backdropFilter: "blur(10px)",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {slugs.map((slug) => {
        const active = activeTab === slug;
        const href = mobilizeGroupDetailHref(groupId, slug);
        const label = GROUP_TAB_SHORT_LABELS[slug] ?? MOBILIZE_GROUP_TAB_LABELS[slug];
        return (
          <IconButton
            key={slug}
            component={Link}
            href={href}
            aria-label={MOBILIZE_GROUP_TAB_LABELS[slug]}
            aria-current={active ? "page" : undefined}
            sx={{
              flex: "1 0 72px",
              minWidth: 72,
              maxWidth: 96,
              flexDirection: "column",
              gap: 0.25,
              borderRadius: 0,
              color: active ? flashpointYellow : "rgba(255,255,255,0.62)",
              py: 0.75,
              textDecoration: "none",
            }}
          >
            {GROUP_TAB_ICONS[slug]}
            <Typography
              component="span"
              variant="caption"
              sx={{ fontSize: "0.62rem", lineHeight: 1.1, fontWeight: active ? 700 : 500 }}
            >
              {label}
            </Typography>
          </IconButton>
        );
      })}
    </Box>
  );
}

export function MobilizeBottomNav(props: Props) {
  if (props.variant === "group") {
    return <MobilizeGroupBottomNav groupId={props.groupId} activeTab={props.activeTab} />;
  }
  return <MobilizeSocialBottomNav />;
}
