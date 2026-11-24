"use client";

import { DiscoverJoinGroupButton } from "@/components/mobilize/social/DiscoverJoinGroupButton";
import { VerifiedUserBadge } from "@/components/user/VerifiedUserBadge";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
} from "@mui/material";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchMember = {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  href: string;
  verified?: boolean;
  verified_at?: string | null;
  is_following?: boolean;
};

type SearchGroup = {
  id: string;
  name: string;
  href: string;
};

function SearchFollowButton({ userId }: { userId: string }) {
  const me = useDashboardUser();
  const [busy, setBusy] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mobilize/social/profiles/${userId}`);
        const json = (await res.json()) as { profile?: { is_following?: boolean } };
        if (!cancelled && res.ok) setFollowing(Boolean(json.profile?.is_following));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (userId === me.id) return null;

  async function toggle() {
    setBusy(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch(`/api/mobilize/social/profiles/${userId}/follow`, { method });
      if (res.ok) setFollowing((v) => !v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="small"
      variant={following ? "outlined" : "contained"}
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      sx={{ textTransform: "none", fontWeight: 700, minWidth: 76, borderRadius: 99, py: 0.25 }}
    >
      {busy ? "…" : following ? "Following" : "Follow"}
    </Button>
  );
}

function SearchResultsPanel({
  loading,
  members,
  groups,
  hasQuery,
  onNavigate,
}: {
  loading: boolean;
  members: SearchMember[];
  groups: SearchGroup[];
  /** At least 2 characters typed — avoid empty-state copy before the user searches. */
  hasQuery: boolean;
  onNavigate?: () => void;
}) {
  const empty = hasQuery && !loading && !members.length && !groups.length;

  return (
    <Paper
      elevation={8}
      sx={{
        mt: 0.75,
        maxHeight: 360,
        overflow: "auto",
        bgcolor: "#1a1d24",
        border: "1px solid rgba(255,215,0,0.18)",
        borderRadius: 2,
      }}
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={22} />
        </Box>
      ) : null}
      {empty ? (
        <Typography variant="body2" sx={{ p: 1.5, color: "rgba(255,255,255,0.55)" }}>
          No results. Try another name.
        </Typography>
      ) : null}
      {groups.length > 0 ? (
        <>
          <Typography
            variant="caption"
            sx={{ display: "block", px: 1.5, pt: 1.25, pb: 0.5, fontWeight: 800, color: "primary.main" }}
          >
            Groups
          </Typography>
          <List dense disablePadding>
            {groups.map((g) => (
              <Box
                key={g.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemButton
                  component={Link}
                  href={g.href}
                  onClick={onNavigate}
                  sx={{ py: 0.5, px: 0.75, flex: 1, minWidth: 0, borderRadius: 1 }}
                >
                  <ListItemText
                    primary={g.name}
                    primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                  />
                </ListItemButton>
                <DiscoverJoinGroupButton groupId={g.id} />
              </Box>
            ))}
          </List>
        </>
      ) : null}
      {members.length > 0 ? (
        <>
          <Typography
            variant="caption"
            sx={{ display: "block", px: 1.5, pt: groups.length ? 0.5 : 1.25, pb: 0.5, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}
          >
            People
          </Typography>
          <List dense disablePadding>
            {members.map((m) => (
              <Box
                key={m.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1,
                  py: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemButton
                  component={Link}
                  href={m.href}
                  onClick={onNavigate}
                  sx={{ py: 0.5, px: 0.75, flex: 1, minWidth: 0, borderRadius: 1, gap: 1 }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      src={m.avatar_url ? publicAssetSrc(m.avatar_url) : undefined}
                      sx={{ width: 36, height: 36 }}
                    >
                      {m.display_name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.display_name}
                        </Box>
                        {m.verified ? <VerifiedUserBadge size={16} verifiedAt={m.verified_at ?? null} /> : null}
                      </Box>
                    }
                    secondary={m.handle}
                    primaryTypographyProps={{ component: "div", fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
                <SearchFollowButton userId={m.id} />
              </Box>
            ))}
          </List>
        </>
      ) : null}
    </Paper>
  );
}

export function DashboardGlobalSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [members, setMembers] = useState<SearchMember[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      setMembers([]);
      setGroups([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/mobilize/social/search?q=${encodeURIComponent(q)}`);
      const json = (await res.json()) as { members?: SearchMember[]; groups?: SearchGroup[] };
      if (!res.ok) throw new Error();
      setGroups(json.groups ?? []);
      setMembers(json.members ?? []);
      setOpen(true);
    } catch {
      setMembers([]);
      setGroups([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "rgba(255,255,255,0.08)",
      borderRadius: 99,
      color: "#f5f5f5",
      fontSize: "0.875rem",
      "& fieldset": { borderColor: "rgba(255,215,0,0.22)" },
      "&:hover fieldset": { borderColor: "rgba(255,215,0,0.35)" },
      "&.Mui-focused fieldset": { borderColor: "primary.main" },
    },
    "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.45)", opacity: 1 },
  } as const;

  const closeMobile = () => {
    setMobileOpen(false);
    setOpen(false);
  };

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{
          display: { xs: "none", md: "block" },
          width: { md: 260, lg: 300 },
          flexShrink: 0,
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Search groups and people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }} />
              </InputAdornment>
            ),
          }}
          sx={fieldSx}
        />
        <Popper
          open={
            open &&
            query.trim().length >= 2 &&
            (loading || members.length > 0 || groups.length > 0)
          }
          anchorEl={anchorRef.current}
          placement="bottom-start"
          sx={{ zIndex: 1400, width: anchorRef.current?.offsetWidth }}
        >
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Box>
              <SearchResultsPanel
                loading={loading}
                members={members}
                groups={groups}
                hasQuery={query.trim().length >= 2}
                onNavigate={() => setOpen(false)}
              />
            </Box>
          </ClickAwayListener>
        </Popper>
      </Box>

      <Box sx={{ display: { xs: "inline-flex", md: "none" }, alignItems: "center" }}>
        <IconButton color="inherit" aria-label="Search" onClick={() => setMobileOpen(true)} size="small">
          <SearchIcon />
        </IconButton>
      </Box>

      <Dialog fullWidth maxWidth="sm" open={mobileOpen} onClose={closeMobile} PaperProps={{ sx: { bgcolor: "#141416", color: "#f5f5f5" } }}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.25,
            pr: 1,
          }}
        >
          Search
          <IconButton aria-label="Close search" onClick={closeMobile} size="small" sx={{ color: "inherit" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            placeholder="Search groups and people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }} />
                </InputAdornment>
              ),
            }}
            sx={{ ...fieldSx, mb: 1.5 }}
          />
          {query.trim().length >= 2 ? (
            <SearchResultsPanel
              loading={loading}
              members={members}
              groups={groups}
              hasQuery
              onNavigate={closeMobile}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}