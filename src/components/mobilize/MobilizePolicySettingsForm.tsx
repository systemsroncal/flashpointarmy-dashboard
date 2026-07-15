"use client";

import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

export function MobilizePolicySettingsForm() {
  const [allowLocalLeader, setAllowLocalLeader] = useState(true);
  const [allowMember, setAllowMember] = useState(false);
  const [autoCloseDays, setAutoCloseDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/policy-settings");
      const j = (await res.json()) as {
        error?: string;
        allow_member_group_create?: boolean;
        allow_local_leader_group_create?: boolean;
        auto_close_inactive_days?: number;
      };
      if (!res.ok) throw new Error(j.error || "Failed to load settings.");
      setAllowMember(Boolean(j.allow_member_group_create));
      setAllowLocalLeader(j.allow_local_leader_group_create !== false);
      setAutoCloseDays(
        Number.isFinite(j.auto_close_inactive_days) ? Number(j.auto_close_inactive_days) : 60
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
          allow_member_group_create: allowMember,
          allow_local_leader_group_create: allowLocalLeader,
          auto_close_inactive_days: days,
        }),
      });
      const j = (await res.json()) as {
        error?: string;
        allow_member_group_create?: boolean;
        allow_local_leader_group_create?: boolean;
        auto_close_inactive_days?: number;
      };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setAllowMember(Boolean(j.allow_member_group_create));
      setAllowLocalLeader(j.allow_local_leader_group_create !== false);
      setAutoCloseDays(
        Number.isFinite(j.auto_close_inactive_days) ? Number(j.auto_close_inactive_days) : days
      );
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 560, bgcolor: "#fafafa", border: "1px solid rgba(0,0,0,0.1)" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Who can create Mobilize chapters & groups
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Dashboard admins and super admins can always create. Use the switches below for local leaders and
        members.
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
        <FormControlLabel
          control={
            <Switch
              checked={allowLocalLeader}
              onChange={(e) => setAllowLocalLeader(e.target.checked)}
              disabled={loading || saving}
            />
          }
          label="Local leaders can create chapters & groups"
        />
        <FormControlLabel
          control={
            <Switch
              checked={allowMember}
              onChange={(e) => setAllowMember(e.target.checked)}
              disabled={loading || saving}
            />
          }
          label="Members can create chapters & groups"
        />
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
        <Box>
          <Button variant="contained" onClick={() => void save()} disabled={loading || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
