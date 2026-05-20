"use client";

import { DONATION_RECURRENCE_OPTIONS } from "@/lib/donations/constants";
import { formatUsdFromCents } from "@/lib/donations/format";
import type { DonationAmountPreset } from "@/types/donations";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";

type Props = {
  initialPresets: DonationAmountPreset[];
  canEdit: boolean;
};

type DraftPreset = DonationAmountPreset;

export function DonationsSettingsClient({ initialPresets, canEdit }: Props) {
  const [presets, setPresets] = useState<DraftPreset[]>(initialPresets);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updatePreset = useCallback((id: string, patch: Partial<DraftPreset>) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/donations/presets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          presets: presets.map((p) => ({
            id: p.id,
            is_enabled: p.is_enabled,
            allow_one_time: p.allow_one_time,
            allow_monthly: p.allow_monthly,
            allow_bimonthly: p.allow_bimonthly,
            allow_quarterly: p.allow_quarterly,
            allow_yearly: p.allow_yearly,
            sort_order: p.sort_order,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage({ type: "success", text: "Donation options saved." });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ letterSpacing: "0.06em", mb: 0.5 }}>
          Donation options
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure predefined amounts and which payment types are available for each (one-time or recurring).
        </Typography>
      </Box>

      {message ? (
        <Alert severity={message.type === "success" ? "success" : "error"} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      ) : null}

      <Paper sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell align="center">Enabled</TableCell>
              <TableCell align="center">One-time</TableCell>
              {DONATION_RECURRENCE_OPTIONS.map((opt) => (
                <TableCell key={opt.value} align="center">
                  {opt.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {presets.map((preset) => (
              <TableRow key={preset.id} sx={{ opacity: preset.is_enabled ? 1 : 0.55 }}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography fontWeight={600}>
                      {preset.is_custom_amount ? "Custom amount" : formatUsdFromCents(preset.amount_cents)}
                    </Typography>
                    {preset.is_custom_amount ? (
                      <Chip size="small" label="Variable" variant="outlined" />
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.is_enabled}
                    disabled={!canEdit}
                    onChange={(_, v) => updatePreset(preset.id, { is_enabled: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.allow_one_time}
                    disabled={!canEdit || !preset.is_enabled}
                    onChange={(_, v) => updatePreset(preset.id, { allow_one_time: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.allow_monthly}
                    disabled={!canEdit || !preset.is_enabled}
                    onChange={(_, v) => updatePreset(preset.id, { allow_monthly: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.allow_bimonthly}
                    disabled={!canEdit || !preset.is_enabled}
                    onChange={(_, v) => updatePreset(preset.id, { allow_bimonthly: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.allow_quarterly}
                    disabled={!canEdit || !preset.is_enabled}
                    onChange={(_, v) => updatePreset(preset.id, { allow_quarterly: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.allow_yearly}
                    disabled={!canEdit || !preset.is_enabled}
                    onChange={(_, v) => updatePreset(preset.id, { allow_yearly: v })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {!canEdit ? (
        <Typography variant="caption" color="text.secondary">
          You have read-only access to donation settings.
        </Typography>
      ) : (
        <Box>
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
            onClick={() => void handleSave()}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
