"use client";

import { MobilizeDialog } from "@/components/mobilize/MobilizeDialog";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIEWER_ROLE_OPTIONS = [
  { value: "admin", label: "Administrators" },
  { value: "sub_admin", label: "Sub administrators" },
  { value: "local_leader", label: "Local leaders" },
  { value: "member", label: "Members" },
] as const;

const CREATOR_ROLE_OPTIONS = [
  { value: "local_leader", label: "Local leaders" },
  {
    value: "verified_local_leader",
    label: "Verified Local leaders",
  },
] as const;

/** Members, leaders, and admins — same set as server search `roles` filter. */
const WHITELIST_SEARCH_ROLES = [
  "member",
  "local_leader",
  "admin",
  "sub_admin",
  "super_admin",
].join(",");

type UserOption = { id: string; label: string };

export function MobilizePolicySettingsForm() {
  const [autoCloseDays, setAutoCloseDays] = useState(60);
  const [groupsImageMaxMb, setGroupsImageMaxMb] = useState(1);
  const [groupsImageMaxCount, setGroupsImageMaxCount] = useState(4);
  const [profileImageMaxMb, setProfileImageMaxMb] = useState(1);
  const [profileImageMaxCount, setProfileImageMaxCount] = useState(4);
  const [chaptersViewerRoles, setChaptersViewerRoles] = useState<string[]>([]);
  const [chaptersViewerUserIds, setChaptersViewerUserIds] = useState<string[]>([]);
  const [groupCreatorRoles, setGroupCreatorRoles] = useState<string[]>(["local_leader"]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchOptions, setSearchOptions] = useState<UserOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    ids: string[];
    label: string;
  } | null>(null);
  const [deleteTyped, setDeleteTyped] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedByIdRef = useRef<Map<string, UserOption>>(new Map());

  const selectedViewerUsers = useMemo(() => {
    const byId = new Map<string, UserOption>([
      ...userOptions.map((u) => [u.id, u] as const),
      ...searchOptions.map((u) => [u.id, u] as const),
      ...selectedByIdRef.current.entries(),
    ]);
    return chaptersViewerUserIds.map(
      (id) => byId.get(id) ?? { id, label: id }
    );
  }, [chaptersViewerUserIds, userOptions, searchOptions]);

  useEffect(() => {
    for (const u of selectedViewerUsers) {
      selectedByIdRef.current.set(u.id, u);
    }
  }, [selectedViewerUsers]);

  const autocompleteOptions = useMemo(() => {
    const byId = new Map<string, UserOption>();
    for (const u of selectedViewerUsers) byId.set(u.id, u);
    for (const u of searchOptions) byId.set(u.id, u);
    return [...byId.values()];
  }, [selectedViewerUsers, searchOptions]);

  const searchUsers = useCallback(async (q: string) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        roles: WHITELIST_SEARCH_ROLES,
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/mobilize/users-search?${params.toString()}`);
      const j = (await res.json()) as {
        users?: { id: string; label: string; email?: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error || "User search failed.");
      setSearchOptions(
        (j.users ?? []).map((u) => ({
          id: u.id,
          label: u.email ? `${u.label} (${u.email})` : u.label,
        }))
      );
    } catch {
      setSearchOptions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function handleSearchInput(value: string) {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => void searchUsers(value), 300);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/policy-settings");
      const j = (await res.json()) as {
        error?: string;
        auto_close_inactive_days?: number;
        groups_image_max_mb?: number;
        groups_image_max_count?: number;
        profile_image_max_mb?: number;
        profile_image_max_count?: number;
        chapters_viewer_roles?: string[];
        chapters_viewer_user_ids?: string[];
        group_creator_roles?: string[];
        allow_local_leader_group_create?: boolean;
        allow_verified_local_leader_group_create?: boolean;
        users?: UserOption[];
      };
      if (!res.ok) throw new Error(j.error || "Failed to load settings.");
      setAutoCloseDays(
        Number.isFinite(j.auto_close_inactive_days) ? Number(j.auto_close_inactive_days) : 60
      );
      setGroupsImageMaxMb(
        Number.isFinite(j.groups_image_max_mb) ? Number(j.groups_image_max_mb) : 1
      );
      setGroupsImageMaxCount(
        Number.isFinite(j.groups_image_max_count) ? Number(j.groups_image_max_count) : 4
      );
      setProfileImageMaxMb(
        Number.isFinite(j.profile_image_max_mb) ? Number(j.profile_image_max_mb) : 1
      );
      setProfileImageMaxCount(
        Number.isFinite(j.profile_image_max_count) ? Number(j.profile_image_max_count) : 4
      );
      setChaptersViewerRoles(Array.isArray(j.chapters_viewer_roles) ? j.chapters_viewer_roles : []);
      setChaptersViewerUserIds(
        Array.isArray(j.chapters_viewer_user_ids) ? j.chapters_viewer_user_ids : []
      );
      if (Array.isArray(j.group_creator_roles) && j.group_creator_roles.length > 0) {
        setGroupCreatorRoles(
          j.group_creator_roles.filter(
            (r) => r === "local_leader" || r === "verified_local_leader"
          )
        );
      } else {
        const roles: string[] = [];
        if (j.allow_local_leader_group_create !== false) roles.push("local_leader");
        if (j.allow_verified_local_leader_group_create === true) {
          roles.push("verified_local_leader");
        }
        setGroupCreatorRoles(roles.length ? roles : ["local_leader"]);
      }
      const resolved = Array.isArray(j.users) ? j.users : [];
      setUserOptions(resolved);
      for (const u of resolved) selectedByIdRef.current.set(u.id, u);
      void searchUsers("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [searchUsers]);

  useEffect(() => {
    void load();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [load]);

  function toggleRole(list: string[], role: string, checked: boolean): string[] {
    if (checked) return [...new Set([...list, role])];
    return list.filter((r) => r !== role);
  }

  function handleViewerUsersChange(next: UserOption[]) {
    const removed = selectedViewerUsers.filter((u) => !next.some((n) => n.id === u.id));
    if (removed.length > 0) {
      setPendingRemoval({
        ids: removed.map((r) => r.id),
        label: removed.length === 1 ? removed[0].label : `${removed.length} selected users`,
      });
      setDeleteTyped("");
      return;
    }
    for (const u of next) selectedByIdRef.current.set(u.id, u);
    setChaptersViewerUserIds(next.map((u) => u.id));
  }

  function closeConfirm() {
    setPendingRemoval(null);
    setDeleteTyped("");
  }

  function confirmRemoval() {
    if (!pendingRemoval) return;
    const ids = new Set(pendingRemoval.ids);
    setChaptersViewerUserIds((prev) => prev.filter((id) => !ids.has(id)));
    closeConfirm();
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      const days = Math.min(3650, Math.max(1, Math.round(Number(autoCloseDays) || 60)));
      const res = await fetch("/api/mobilize/policy-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_creator_roles: groupCreatorRoles,
          auto_close_inactive_days: days,
          groups_image_max_mb: groupsImageMaxMb,
          groups_image_max_count: groupsImageMaxCount,
          profile_image_max_mb: profileImageMaxMb,
          profile_image_max_count: profileImageMaxCount,
          chapters_viewer_roles: chaptersViewerRoles,
          chapters_viewer_user_ids: chaptersViewerUserIds,
        }),
      });
      const j = (await res.json()) as {
        error?: string;
        auto_close_inactive_days?: number;
        groups_image_max_mb?: number;
        groups_image_max_count?: number;
        profile_image_max_mb?: number;
        profile_image_max_count?: number;
        chapters_viewer_roles?: string[];
        chapters_viewer_user_ids?: string[];
        group_creator_roles?: string[];
      };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setAutoCloseDays(
        Number.isFinite(j.auto_close_inactive_days) ? Number(j.auto_close_inactive_days) : days
      );
      setGroupsImageMaxMb(
        Number.isFinite(j.groups_image_max_mb) ? Number(j.groups_image_max_mb) : groupsImageMaxMb
      );
      setGroupsImageMaxCount(
        Number.isFinite(j.groups_image_max_count)
          ? Number(j.groups_image_max_count)
          : groupsImageMaxCount
      );
      setProfileImageMaxMb(
        Number.isFinite(j.profile_image_max_mb) ? Number(j.profile_image_max_mb) : profileImageMaxMb
      );
      setProfileImageMaxCount(
        Number.isFinite(j.profile_image_max_count)
          ? Number(j.profile_image_max_count)
          : profileImageMaxCount
      );
      setChaptersViewerRoles(Array.isArray(j.chapters_viewer_roles) ? j.chapters_viewer_roles : []);
      setChaptersViewerUserIds(
        Array.isArray(j.chapters_viewer_user_ids) ? j.chapters_viewer_user_ids : []
      );
      if (Array.isArray(j.group_creator_roles)) setGroupCreatorRoles(j.group_creator_roles);
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 640, bgcolor: "#fafafa", border: "1px solid rgba(0,0,0,0.1)" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Who can create Groups
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Administrators and super administrators can always create Mobilize chapters and groups. Local
        leaders may only create groups (not chapters). Choose who among local leaders can create
        groups.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {savedOk ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSavedOk(false)}>
          Settings saved.
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Local leader options
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Verified Local leaders are marked in People → Leaders (Edit leader → Local Leader
            Verified).
          </Typography>
          <FormGroup>
            {CREATOR_ROLE_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                control={
                  <Checkbox
                    checked={groupCreatorRoles.includes(opt.value)}
                    onChange={(e) =>
                      setGroupCreatorRoles((prev) => toggleRole(prev, opt.value, e.target.checked))
                    }
                    disabled={loading || saving}
                  />
                }
                label={opt.label}
              />
            ))}
          </FormGroup>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Who can view Mobilize (Chapters)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Super administrators always have access. Select additional roles and/or specific users
            (whitelist).
          </Typography>
          <FormGroup>
            {VIEWER_ROLE_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                control={
                  <Checkbox
                    checked={chaptersViewerRoles.includes(opt.value)}
                    onChange={(e) =>
                      setChaptersViewerRoles((prev) =>
                        toggleRole(prev, opt.value, e.target.checked)
                      )
                    }
                    disabled={loading || saving}
                  />
                }
                label={opt.label}
              />
            ))}
          </FormGroup>
          <Autocomplete
            multiple
            sx={{ mt: 1.5 }}
            options={autocompleteOptions}
            value={selectedViewerUsers}
            onChange={(_, v) => handleViewerUsersChange(v)}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear") handleSearchInput(value);
            }}
            filterOptions={(opts) => opts}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            disabled={loading || saving}
            filterSelectedOptions
            loading={searchLoading}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option.label} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Specific users (whitelist)"
                placeholder="Search name or email…"
                helperText="Searches members, local leaders, and admins in the database."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        <TextField
          label="Auto-close inactive groups (days)"
          type="number"
          size="small"
          value={autoCloseDays}
          onChange={(e) => setAutoCloseDays(Number(e.target.value))}
          disabled={loading || saving}
          helperText="Groups with no activity longer than this become Auto-closed. Super admin only."
          inputProps={{ min: 1, max: 3650 }}
          sx={{ maxWidth: 280 }}
        />

        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Groups — image uploads
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Limits for images attached to group wall posts.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Max image weight (MB)"
              type="number"
              size="small"
              value={groupsImageMaxMb}
              onChange={(e) => setGroupsImageMaxMb(Number(e.target.value))}
              disabled={loading || saving}
              inputProps={{ min: 0.1, max: 50, step: 0.1 }}
              sx={{ maxWidth: 220 }}
            />
            <TextField
              label="Max images per post"
              type="number"
              size="small"
              value={groupsImageMaxCount}
              onChange={(e) => setGroupsImageMaxCount(Number(e.target.value))}
              disabled={loading || saving}
              inputProps={{ min: 1, max: 20, step: 1 }}
              sx={{ maxWidth: 220 }}
            />
          </Stack>
        </Box>

        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            User profile — image uploads
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Limits for images attached to Mobilize user profile posts.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Max image weight (MB)"
              type="number"
              size="small"
              value={profileImageMaxMb}
              onChange={(e) => setProfileImageMaxMb(Number(e.target.value))}
              disabled={loading || saving}
              inputProps={{ min: 0.1, max: 50, step: 0.1 }}
              sx={{ maxWidth: 220 }}
            />
            <TextField
              label="Max images per post"
              type="number"
              size="small"
              value={profileImageMaxCount}
              onChange={(e) => setProfileImageMaxCount(Number(e.target.value))}
              disabled={loading || saving}
              inputProps={{ min: 1, max: 20, step: 1 }}
              sx={{ maxWidth: 220 }}
            />
          </Stack>
        </Box>

        <Box>
          <Button variant="contained" onClick={() => void save()} disabled={loading || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Stack>

      <MobilizeDialog open={pendingRemoval !== null} onClose={closeConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Remove from whitelist</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to remove <strong>{pendingRemoval?.label}</strong> from “Who can view
            Mobilize (Chapters)”. They will lose access to Mobilize Chapters unless their role
            grants it.
          </Typography>
          <TextField
            size="small"
            label='Type “DELETE” to confirm'
            fullWidth
            value={deleteTyped}
            onChange={(e) => setDeleteTyped(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteTyped.trim() !== "DELETE"}
            onClick={confirmRemoval}
          >
            Remove
          </Button>
        </DialogActions>
      </MobilizeDialog>
    </Paper>
  );
}
