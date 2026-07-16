"use client";

import {
  MOBILIZE_ALERTS_HREF,
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_MESSAGES_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_SOCIAL_SETTINGS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";
import { mobilizeMemberProfileHref } from "@/lib/mobilize/social/profile-href";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, InputAdornment, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

const TRUTH_ACCENT = "#ff2952";

type NavKey = "home" | "alerts" | "messages" | "groups" | "bookmarks" | "profile" | "settings";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
};

export function MobilizeSocialInternalNav() {
  const me = useDashboardUser();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    members: { id: string; display_name: string; handle: string; href: string }[];
    groups: { id: string; name: string; href: string }[];
  }>({ members: [], groups: [] });
  const profileHref = mobilizeMemberProfileHref(me.id);

  const items = useMemo<NavItem[]>(
    () => [
      { key: "home", label: "Home", href: MOBILIZE_HOME_HREF, icon: <HomeOutlinedIcon fontSize="small" /> },
      { key: "alerts", label: "Alerts", href: MOBILIZE_ALERTS_HREF, icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
      { key: "messages", label: "Messages", href: MOBILIZE_MESSAGES_HREF, icon: <MailOutlineIcon fontSize="small" /> },
      { key: "groups", label: "Groups", href: MOBILIZE_MY_GROUPS_HREF, icon: <GroupsOutlinedIcon fontSize="small" /> },
      { key: "bookmarks", label: "Bookmarks", href: MOBILIZE_BOOKMARKS_HREF, icon: <BookmarkBorderOutlinedIcon fontSize="small" /> },
      { key: "profile", label: "Profile", href: profileHref, icon: <PersonOutlineIcon fontSize="small" /> },
      {
        key: "settings",
        label: "Settings",
        href: MOBILIZE_SOCIAL_SETTINGS_HREF,
        icon: <SettingsOutlinedIcon fontSize="small" />,
      },
    ],
    [profileHref]
  );

  function isActive(item: NavItem): boolean {
    if (item.key === "home") return pathname === MOBILIZE_HOME_HREF || pathname === "/dashboard/mobilize";
    if (item.key === "profile") return pathname === profileHref;
    if (item.key === "groups") return pathname.startsWith(MOBILIZE_MY_GROUPS_HREF);
    if (item.key === "settings") return pathname.startsWith(MOBILIZE_SOCIAL_SETTINGS_HREF);
    return pathname.startsWith(item.href);
  }

  async function runSearch(query: string) {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults({ members: [], groups: [] });
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/mobilize/social/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error();
      setSearchResults({ members: json.members ?? [], groups: json.groups ?? [] });
      setSearchOpen(true);
    } catch {
      setSearchResults({ members: [], groups: [] });
      setSearchOpen(false);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <Box
      sx={{
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        width: 240,
        flexShrink: 0,
        px: 1.5,
        py: 2,
        alignSelf: "stretch",
        bgcolor: "#0f1419",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <TextField
        size="small"
        placeholder="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          void runSearch(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void runSearch(search);
        }}
        onBlur={() => {
          window.setTimeout(() => setSearchOpen(false), 150);
        }}
        onFocus={() => {
          if (search.trim().length >= 2) setSearchOpen(true);
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.45)" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            bgcolor: "rgba(255,255,255,0.06)",
            borderRadius: 99,
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
          },
          "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.45)", opacity: 1 },
        }}
      />

      {searchOpen ? (
        <Box
          sx={{
            mb: 2,
            mt: -1,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.1)",
            bgcolor: "#151b22",
            overflow: "hidden",
          }}
        >
          {searchLoading ? (
            <Typography variant="caption" sx={{ display: "block", p: 1.25, color: "rgba(255,255,255,0.5)" }}>
              Searching…
            </Typography>
          ) : null}
          {!searchLoading && !searchResults.members.length && !searchResults.groups.length ? (
            <Typography variant="caption" sx={{ display: "block", p: 1.25, color: "rgba(255,255,255,0.5)" }}>
              No results
            </Typography>
          ) : null}
          {searchResults.members.map((m) => (
            <ListItemButton
              key={m.id}
              component={Link}
              href={m.href}
              sx={{ py: 0.75, color: "rgba(255,255,255,0.85)" }}
            >
              <ListItemText primary={m.display_name} secondary={m.handle} />
            </ListItemButton>
          ))}
          {searchResults.groups.map((g) => (
            <ListItemButton
              key={g.id}
              component={Link}
              href={g.href}
              sx={{ py: 0.75, color: "rgba(255,255,255,0.85)" }}
            >
              <ListItemText primary={g.name} secondary="Group" />
            </ListItemButton>
          ))}
        </Box>
      ) : null}

      <List disablePadding sx={{ flex: 1 }}>
        {items.map((item) => {
          const active = isActive(item);
          return (
            <ListItemButton
              key={item.key}
              component={Link}
              href={item.href}
              sx={{
                borderRadius: 99,
                mb: 0.35,
                py: 0.85,
                color: active ? "#fff" : "rgba(255,255,255,0.72)",
                bgcolor: active ? "rgba(255,41,82,0.12)" : "transparent",
                "&:hover": { bgcolor: active ? "rgba(255,41,82,0.16)" : "rgba(255,255,255,0.06)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? TRUTH_ACCENT : "inherit" }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: "0.95rem" }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", px: 1, pt: 1 }}>
        Social hub
      </Typography>
    </Box>
  );
}
