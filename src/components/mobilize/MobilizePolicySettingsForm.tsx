"use client";

import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
  Alert,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

export function MobilizePolicySettingsForm() {
  const [allowLocalLeader, setAllowLocalLeader] = useState(true);
  const [allowMember, setAllowMember] = useState(false);
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
      };
      if (!res.ok) throw new Error(j.error || "Failed to load settings.");
      setAllowMember(Boolean(j.allow_member_group_create));
      setAllowLocalLeader(j.allow_local_leader_group_create !== false);
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
      const res = await fetch("/api/mobilize/policy-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allow_member_group_create: allowMember,
          allow_local_leader_group_create: allowLocalLeader,
        }),
      });
      const j = (await res.json()) as {
        error?: string;
        allow_member_group_create?: boolean;
        allow_local_leader_group_create?: boolean;
      };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setAllowMember(Boolean(j.allow_member_group_create));
      setAllowLocalLeader(j.allow_local_leader_group_create !== false);
      setSavedOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 560, bgcolor: "rgba(0,0,0,0.35)" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Who can create Mobilize groups
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Dashboard admins and super admins can always create groups. Use the switches below for local
        leaders and members.
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
          label="Local leaders can create groups"
        />
        <FormControlLabel
          control={
            <Switch
              checked={allowMember}
              onChange={(e) => setAllowMember(e.target.checked)}
              disabled={loading || saving}
            />
          }
          label="Members can create groups"
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
