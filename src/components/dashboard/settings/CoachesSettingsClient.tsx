"use client";

import type { AdminStaffOption } from "@/lib/onboarding/onboarding-records";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

export function CoachesSettingsClient() {
  const [pool, setPool] = useState<AdminStaffOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/coaches", { cache: "no-store" });
      const json = (await res.json()) as {
        error?: string;
        pool?: AdminStaffOption[];
        coach_ids?: string[];
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setPool(json.pool ?? []);
      setSelectedIds(json.coach_ids ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => {
    const byId = new Map(pool.map((p) => [p.id, p]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as AdminStaffOption[];
  }, [pool, selectedIds]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/onboarding/coaches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_ids: selectedIds }),
      });
      const json = (await res.json()) as { error?: string; coach_ids?: string[] };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      setSelectedIds(json.coach_ids ?? selectedIds);
      setSuccess("Coaches updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, bgcolor: "rgba(0,0,0,0.35)", maxWidth: 720 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Coaches
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Select administrators who can be assigned as coaches when editing coach meeting and onboarding
        call requests. If none are selected, all administrators remain available.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Autocomplete
        multiple
        options={pool}
        value={selected}
        onChange={(_, value) => setSelectedIds(value.map((v) => v.id))}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(opts, state) => {
          const q = state.inputValue.trim().toLowerCase();
          if (!q) return opts;
          return opts.filter((o) => `${o.label} ${o.email}`.toLowerCase().includes(q));
        }}
        renderInput={(params) => (
          <TextField {...params} label="Coaches" placeholder="Search administrators…" />
        )}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
        {saving ? <CircularProgress size={22} color="inherit" /> : "Save coaches"}
      </Button>
    </Paper>
  );
}
