"use client";

import { DONATION_RECURRENCE_OPTIONS } from "@/lib/donations/constants";
import { parseDollarsToCents } from "@/lib/donations/format";
import type { DonationAmountPreset } from "@/types/donations";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";

type Props = {
  initialPresets: DonationAmountPreset[];
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
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

function formatCentsLabel(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

type NewPresetDraft = {
  amountDollars: string;
  allow_one_time: boolean;
  allow_monthly: boolean;
  allow_bimonthly: boolean;
  allow_quarterly: boolean;
  allow_yearly: boolean;
};

const EMPTY_NEW_PRESET: NewPresetDraft = {
  amountDollars: "",
  allow_one_time: true,
  allow_monthly: false,
  allow_bimonthly: false,
  allow_quarterly: false,
  allow_yearly: false,
};

export function DonationsSettingsClient({
  initialPresets,
  canEdit,
  canCreate,
  canDelete,
}: Props) {
  const [presets, setPresets] = useState<DraftPreset[]>(() =>
    initialPresets.map(presetToDraft)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /** Delete-confirmation dialog state. */
  const [deleteTarget, setDeleteTarget] = useState<DraftPreset | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** Add-new-preset dialog state. */
  const [addOpen, setAddOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<NewPresetDraft>(EMPTY_NEW_PRESET);
  const [creating, setCreating] = useState(false);

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
          return { ...p, amount_cents: cents, label: formatCentsLabel(cents) };
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/donations/presets/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setPresets((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setMessage({ type: "success", text: `Removed ${deleteTarget.label}.` });
      setDeleteTarget(null);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Delete failed",
      });
    } finally {
      setDeleting(false);
    }
  }

  const newAmountCents = parseDollarsToCents(newPreset.amountDollars);
  const newAmountValid = newAmountCents != null && newAmountCents > 0;

  async function handleCreate() {
    if (!newAmountValid || newAmountCents == null) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/donations/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount_cents: newAmountCents,
          allow_one_time: newPreset.allow_one_time,
          allow_monthly: newPreset.allow_monthly,
          allow_bimonthly: newPreset.allow_bimonthly,
          allow_quarterly: newPreset.allow_quarterly,
          allow_yearly: newPreset.allow_yearly,
        }),
      });
      const data = (await res.json()) as {
        preset?: DonationAmountPreset;
        error?: string;
      };
      if (!res.ok || !data.preset) throw new Error(data.error ?? "Create failed");

      const draft = presetToDraft(data.preset);
      setPresets((prev) => {
        const next = [...prev, draft];
        return next.sort((a, b) => {
          if (a.is_custom_amount !== b.is_custom_amount) {
            return a.is_custom_amount ? 1 : -1;
          }
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
      });

      setMessage({ type: "success", text: `Added ${draft.label}.` });
      setAddOpen(false);
      setNewPreset(EMPTY_NEW_PRESET);
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Create failed",
      });
    } finally {
      setCreating(false);
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

      {canCreate ? (
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setNewPreset(EMPTY_NEW_PRESET);
              setAddOpen(true);
            }}
          >
            Add donation option
          </Button>
        </Box>
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
              {canDelete ? <TableCell align="center">Actions</TableCell> : null}
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
                {canDelete ? (
                  <TableCell align="center">
                    {preset.is_custom_amount ? (
                      <Typography variant="caption" color="text.disabled">
                        —
                      </Typography>
                    ) : (
                      <Tooltip title="Delete option">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={saving || deleting}
                            onClick={() => setDeleteTarget(preset)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                ) : null}
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

      {/* Add new preset dialog */}
      <Dialog
        open={addOpen}
        onClose={() => (creating ? undefined : setAddOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add donation option</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              size="small"
              label="Amount (USD)"
              value={newPreset.amountDollars}
              onChange={(e) =>
                setNewPreset((prev) => ({ ...prev, amountDollars: e.target.value }))
              }
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
              error={newPreset.amountDollars.length > 0 && !newAmountValid}
              helperText={
                newPreset.amountDollars.length > 0 && !newAmountValid
                  ? "Enter a valid amount greater than $0."
                  : undefined
              }
              FormHelperTextProps={
                newPreset.amountDollars.length > 0 && !newAmountValid
                  ? undefined
                  : { sx: { display: "none", m: 0, minHeight: 0 } }
              }
            />
            <Typography variant="caption" color="text.secondary">
              Choose which payment modes this option supports:
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">One-time</Typography>
              <Switch
                checked={newPreset.allow_one_time}
                onChange={(_, v) =>
                  setNewPreset((prev) => ({ ...prev, allow_one_time: v }))
                }
              />
            </Stack>
            {DONATION_RECURRENCE_OPTIONS.map((opt) => (
              <Stack
                key={opt.value}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">{opt.label}</Typography>
                <Switch
                  checked={
                    newPreset[
                      `allow_${opt.value}` as keyof Pick<
                        NewPresetDraft,
                        | "allow_monthly"
                        | "allow_bimonthly"
                        | "allow_quarterly"
                        | "allow_yearly"
                      >
                    ]
                  }
                  onChange={(_, v) =>
                    setNewPreset((prev) => ({
                      ...prev,
                      [`allow_${opt.value}`]: v,
                    }))
                  }
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddOpen(false)}
            disabled={creating}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void handleCreate()}
            disabled={creating || !newAmountValid}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {creating ? "Adding…" : "Add option"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete donation option?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{deleteTarget?.label}</strong>? Past orders and subscriptions
            tied to this amount keep their records; only the option itself is removed
            from the Donate page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleDelete()}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
