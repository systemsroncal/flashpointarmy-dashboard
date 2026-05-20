"use client";

import { DONATION_RECURRENCE_OPTIONS } from "@/lib/donations/constants";
import { formatUsdFromCents, parseDollarsToCents } from "@/lib/donations/format";
import type { DonationAmountPreset } from "@/types/donations";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

type Props = {
  initialPresets: DonationAmountPreset[];
  canEdit: boolean;
};

type DraftPreset = DonationAmountPreset & { amountDollars: string };

function presetToDraft(p: DonationAmountPreset): DraftPreset {
  const dollars = p.amount_cents / 100;
  return {
    ...p,
    amountDollars: p.is_custom_amount
      ? ""
      : dollars % 1 === 0
        ? dollars.toFixed(0)
        : dollars.toFixed(2),
  };
}

export function DonationsSettingsClient({ initialPresets, canEdit }: Props) {
  const [presets, setPresets] = useState<DraftPreset[]>(() =>
    initialPresets.map(presetToDraft)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updatePreset = useCallback((id: string, patch: Partial<DraftPreset>) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const invalidRow = useMemo(
    () =>
      presets.find(
        (p) => !p.is_custom_amount && parseDollarsToCents(p.amountDollars) == null
      ),
    [presets]
  );

  async function handleSave() {
    if (invalidRow) {
      setMessage({
        type: "error",
        text: `Enter a valid amount greater than $0 (row: ${invalidRow.label}).`,
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = presets.map((p) => {
        const amountCents = p.is_custom_amount
          ? p.amount_cents
          : (parseDollarsToCents(p.amountDollars) ?? p.amount_cents);
        return {
          id: p.id,
          amount_cents: amountCents,
          is_enabled: p.is_enabled,
          allow_one_time: p.allow_one_time,
          allow_monthly: p.allow_monthly,
          allow_bimonthly: p.allow_bimonthly,
          allow_quarterly: p.allow_quarterly,
          allow_yearly: p.allow_yearly,
          sort_order: p.sort_order,
        };
      });

      const res = await fetch("/api/donations/presets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ presets: payload }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setPresets((prev) =>
        prev.map((p) => {
          if (p.is_custom_amount) return p;
          const cents = parseDollarsToCents(p.amountDollars);
          if (cents == null) return p;
          const dollars = cents / 100;
          return {
            ...p,
            amount_cents: cents,
            label: `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`,
          };
        })
      );

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
              <TableCell sx={{ minWidth: 150 }}>Amount (USD)</TableCell>
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
                  {preset.is_custom_amount ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={600}>Custom amount</Typography>
                      <Chip size="small" label="Variable" variant="outlined" />
                    </Stack>
                  ) : (
                    <TextField
                      size="small"
                      value={preset.amountDollars}
                      disabled={!canEdit || saving}
                      onChange={(e) =>
                        updatePreset(preset.id, { amountDollars: e.target.value })
                      }
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        },
                      }}
                      error={
                        preset.amountDollars.length > 0 &&
                        parseDollarsToCents(preset.amountDollars) == null
                      }
                      helperText={
                        preset.amountDollars.length > 0 &&
                        parseDollarsToCents(preset.amountDollars) == null
                          ? "Invalid amount"
                          : formatUsdFromCents(
                              parseDollarsToCents(preset.amountDollars) ??
                                preset.amount_cents
                            )
                      }
                      sx={{ width: 140 }}
                    />
                  )}
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
            disabled={saving || Boolean(invalidRow)}
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
