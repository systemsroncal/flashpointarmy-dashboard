"use client";

import {
  DONATION_DEFAULT_CHECKOUT_URL,
  type DonationPackageCardStyle,
} from "@/lib/donations/constants";
import { parseDollarsToCents } from "@/lib/donations/format";
import type { DonationAmountPreset } from "@/types/donations";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

type DraftPreset = DonationAmountPreset & {
  amountDollars: string;
  titleDraft: string;
  descriptionDraft: string;
  checkoutUrlDraft: string;
};

function presetToDraft(p: DonationAmountPreset): DraftPreset {
  const dollars = p.amount_cents / 100;
  return {
    ...p,
    titleDraft: p.title?.trim() ?? "",
    descriptionDraft: p.description?.trim() ?? "",
    checkoutUrlDraft: p.checkout_url?.trim() ?? DONATION_DEFAULT_CHECKOUT_URL,
    amountDollars:
      dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2),
  };
}

function formatCentsLabel(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

type NewPackageDraft = {
  title: string;
  description: string;
  amountDollars: string;
  checkoutUrl: string;
  card_style: DonationPackageCardStyle;
  is_recommended: boolean;
};

const EMPTY_NEW_PACKAGE: NewPackageDraft = {
  title: "",
  description: "",
  amountDollars: "",
  checkoutUrl: DONATION_DEFAULT_CHECKOUT_URL,
  card_style: "light",
  is_recommended: false,
};

export function DonationsSettingsClient({
  initialPresets,
  canEdit,
  canCreate,
  canDelete,
}: Props) {
  const [presets, setPresets] = useState<DraftPreset[]>(() =>
    initialPresets.filter((p) => !p.is_custom_amount).map(presetToDraft)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftPreset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newPackage, setNewPackage] = useState<NewPackageDraft>(EMPTY_NEW_PACKAGE);
  const [creating, setCreating] = useState(false);

  const updatePreset = useCallback((id: string, patch: Partial<DraftPreset>) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const invalidRow = useMemo(
    () =>
      presets.find((p) => {
        if (!p.titleDraft.trim()) return true;
        if (parseDollarsToCents(p.amountDollars) == null) return true;
        if (!isValidHttpUrl(p.checkoutUrlDraft)) return true;
        return false;
      }),
    [presets]
  );

  async function handleSave() {
    if (invalidRow) {
      setMessage({
        type: "error",
        text: `Check title, amount, and checkout URL for "${invalidRow.titleDraft || invalidRow.label}".`,
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = presets.map((p) => {
        const amountCents = parseDollarsToCents(p.amountDollars) ?? p.amount_cents;
        return {
          id: p.id,
          title: p.titleDraft.trim(),
          description: p.descriptionDraft.trim() || null,
          checkout_url: p.checkoutUrlDraft.trim(),
          amount_cents: amountCents,
          label: formatCentsLabel(amountCents),
          is_enabled: p.is_enabled,
          is_recommended: p.is_recommended,
          card_style: p.card_style,
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
          const cents = parseDollarsToCents(p.amountDollars);
          if (cents == null) return p;
          return {
            ...p,
            amount_cents: cents,
            label: formatCentsLabel(cents),
            title: p.titleDraft.trim(),
            description: p.descriptionDraft.trim() || null,
            checkout_url: p.checkoutUrlDraft.trim(),
          };
        })
      );

      setMessage({ type: "success", text: "Partnership packages saved." });
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
      setMessage({ type: "success", text: `Removed ${deleteTarget.titleDraft || deleteTarget.label}.` });
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

  const newAmountCents = parseDollarsToCents(newPackage.amountDollars);
  const newPackageValid =
    newPackage.title.trim().length > 0 &&
    newAmountCents != null &&
    newAmountCents > 0 &&
    isValidHttpUrl(newPackage.checkoutUrl);

  async function handleCreate() {
    if (!newPackageValid || newAmountCents == null) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/donations/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newPackage.title.trim(),
          description: newPackage.description.trim() || null,
          amount_cents: newAmountCents,
          checkout_url: newPackage.checkoutUrl.trim(),
          card_style: newPackage.card_style,
          is_recommended: newPackage.is_recommended,
        }),
      });
      const data = (await res.json()) as {
        preset?: DonationAmountPreset;
        error?: string;
      };
      if (!res.ok || !data.preset) throw new Error(data.error ?? "Create failed");

      const draft = presetToDraft(data.preset);
      setPresets((prev) => [...prev, draft].sort((a, b) => a.sort_order - b.sort_order));
      setMessage({ type: "success", text: `Added ${draft.titleDraft || draft.label}.` });
      setAddOpen(false);
      setNewPackage(EMPTY_NEW_PACKAGE);
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
          Partnership packages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the packages shown on{" "}
          <Box component="span" sx={{ color: "primary.light" }}>
            /dashboard/donate
          </Box>
          . Each package links to SecureGive (or another checkout URL). Payments are handled externally — not
          through Stripe in the dashboard.
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
              setNewPackage(EMPTY_NEW_PACKAGE);
              setAddOpen(true);
            }}
          >
            Add package
          </Button>
        </Box>
      ) : null}

      <Paper sx={{ overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 160 }}>Title</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Description</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Amount</TableCell>
              <TableCell sx={{ minWidth: 280 }}>Checkout URL</TableCell>
              <TableCell>Style</TableCell>
              <TableCell align="center">Recommended</TableCell>
              <TableCell align="center">Enabled</TableCell>
              <TableCell align="center">Order</TableCell>
              {canDelete ? <TableCell align="center">Actions</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {presets.map((preset) => (
              <TableRow key={preset.id} sx={{ opacity: preset.is_enabled ? 1 : 0.55 }}>
                <TableCell>
                  <TextField
                    size="small"
                    value={preset.titleDraft}
                    disabled={!canEdit || saving}
                    onChange={(e) => updatePreset(preset.id, { titleDraft: e.target.value })}
                    placeholder="Founding Supporter"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={preset.descriptionDraft}
                    disabled={!canEdit || saving}
                    onChange={(e) => updatePreset(preset.id, { descriptionDraft: e.target.value })}
                    placeholder="Short description"
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={preset.amountDollars}
                    disabled={!canEdit || saving}
                    onChange={(e) => updatePreset(preset.id, { amountDollars: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      },
                    }}
                    error={
                      preset.amountDollars.length > 0 &&
                      parseDollarsToCents(preset.amountDollars) == null
                    }
                    sx={{ width: 110 }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <TextField
                      size="small"
                      value={preset.checkoutUrlDraft}
                      disabled={!canEdit || saving}
                      onChange={(e) => updatePreset(preset.id, { checkoutUrlDraft: e.target.value })}
                      error={
                        preset.checkoutUrlDraft.length > 0 &&
                        !isValidHttpUrl(preset.checkoutUrlDraft)
                      }
                      fullWidth
                    />
                    {isValidHttpUrl(preset.checkoutUrlDraft) ? (
                      <Tooltip title="Open URL">
                        <IconButton
                          size="small"
                          component="a"
                          href={preset.checkoutUrlDraft.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 110 }} disabled={!canEdit || saving}>
                    <InputLabel id={`style-${preset.id}`}>Style</InputLabel>
                    <Select
                      labelId={`style-${preset.id}`}
                      label="Style"
                      value={preset.card_style}
                      onChange={(e) =>
                        updatePreset(preset.id, {
                          card_style: e.target.value as DonationPackageCardStyle,
                        })
                      }
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="accent">Accent (yellow)</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.is_recommended}
                    disabled={!canEdit}
                    onChange={(_, v) => updatePreset(preset.id, { is_recommended: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={preset.is_enabled}
                    disabled={!canEdit}
                    onChange={(_, v) => updatePreset(preset.id, { is_enabled: v })}
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    size="small"
                    type="number"
                    value={preset.sort_order}
                    disabled={!canEdit || saving}
                    onChange={(e) =>
                      updatePreset(preset.id, { sort_order: Number(e.target.value) || 0 })
                    }
                    sx={{ width: 72 }}
                    inputProps={{ min: 0, step: 1 }}
                  />
                </TableCell>
                {canDelete ? (
                  <TableCell align="center">
                    <Tooltip title="Delete package">
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
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {!canEdit ? (
        <Typography variant="caption" color="text.secondary">
          You have read-only access to partnership packages.
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

      <Dialog
        open={addOpen}
        onClose={() => (creating ? undefined : setAddOpen(false))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add partnership package</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              size="small"
              label="Title"
              value={newPackage.title}
              onChange={(e) => setNewPackage((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
            />
            <TextField
              size="small"
              label="Description"
              value={newPackage.description}
              onChange={(e) => setNewPackage((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              size="small"
              label="Amount (USD / month display)"
              value={newPackage.amountDollars}
              onChange={(e) => setNewPackage((prev) => ({ ...prev, amountDollars: e.target.value }))}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                },
              }}
              error={newPackage.amountDollars.length > 0 && !newAmountCents}
            />
            <TextField
              size="small"
              label="Checkout URL"
              value={newPackage.checkoutUrl}
              onChange={(e) => setNewPackage((prev) => ({ ...prev, checkoutUrl: e.target.value }))}
              error={newPackage.checkoutUrl.length > 0 && !isValidHttpUrl(newPackage.checkoutUrl)}
              helperText="SecureGive or other external checkout link"
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="new-package-style">Card style</InputLabel>
              <Select
                labelId="new-package-style"
                label="Card style"
                value={newPackage.card_style}
                onChange={(e) =>
                  setNewPackage((prev) => ({
                    ...prev,
                    card_style: e.target.value as DonationPackageCardStyle,
                  }))
                }
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="accent">Accent (yellow)</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">Show “Recommended” badge</Typography>
              <Switch
                checked={newPackage.is_recommended}
                onChange={(_, v) => setNewPackage((prev) => ({ ...prev, is_recommended: v }))}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={creating} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => void handleCreate()}
            disabled={creating || !newPackageValid}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {creating ? "Adding…" : "Add package"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (deleting ? undefined : setDeleteTarget(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete package?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{deleteTarget?.titleDraft || deleteTarget?.label}</strong>? It will no longer appear
            on the Donate page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} color="inherit">
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
