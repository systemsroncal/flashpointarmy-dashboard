"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const selectedViewerUsers = useMemo(() => {
    const byId = new Map(userOptions.map((u) => [u.id, u] as const));
    return chaptersViewerUserIds
      .map((id) => byId.get(id))
      .filter(Boolean) as UserOption[];
  }, [chaptersViewerUserIds, userOptions]);

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
      setUserOptions(Array.isArray(j.users) ? j.users : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleRole(list: string[], role: string, checked: boolean): string[] {
    if (checked) return [...new Set([...list, role])];
    return list.filter((r) => r !== role);
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
            options={userOptions}
            value={selectedViewerUsers}
            onChange={(_, v) => setChaptersViewerUserIds(v.map((u) => u.id))}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            disabled={loading || saving}
            filterSelectedOptions
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
                placeholder="Search users…"
                helperText="Selected users can open Mobilize Chapters even if their role is not checked above."
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
    </Paper>
  );
}
