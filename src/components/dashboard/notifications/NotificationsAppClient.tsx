"use client";

import type { AnnouncementCta, AnnouncementListItem } from "@/lib/dashboard/announcements-types";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

const PREVIEW_CHARS = 240;

function emptyCta(): AnnouncementCta {
  return {
    label: "",
    url: "",
    open_in_new_tab: true,
    bg_color: "#1976d2",
    text_color: "#ffffff",
  };
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(s: string): string | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Snack = { message: string; severity: "success" | "error" };

export function NotificationsAppClient({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<AnnouncementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readMoreCollapsed, setReadMoreCollapsed] = useState(false);
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresLocal, setExpiresLocal] = useState("");
  const [ctas, setCtas] = useState<AnnouncementCta[]>([]);

  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/announcements", { cache: "no-store" });
      const data = (await res.json()) as { announcements?: AnnouncementListItem[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load notifications.");
      setItems(data.announcements ?? []);
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setReadMoreCollapsed(false);
    setUseExpiry(false);
    setExpiresLocal("");
    setCtas([]);
    setDialogOpen(true);
  };

  const openEdit = (row: AnnouncementListItem) => {
    setEditingId(row.id);
    setTitle(row.title);
    setDescription(row.description);
    setReadMoreCollapsed(row.read_more_collapsed);
    const ex = row.expires_at;
    if (ex) {
      setUseExpiry(true);
      setExpiresLocal(toLocalDatetimeValue(ex));
    } else {
      setUseExpiry(false);
      setExpiresLocal("");
    }
    setCtas(row.ctas?.length ? row.ctas.map((c) => ({ ...c })) : []);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setConfirmSaveEdit(false);
  };

  const submitPayload = useMemo(
    () => ({
      title: title.trim(),
      description: description.trim(),
      read_more_collapsed: readMoreCollapsed,
      expires_at: useExpiry ? fromLocalDatetimeValue(expiresLocal) : null,
      ctas: ctas
        .filter((c) => c.label.trim() && c.url.trim())
        .slice(0, 3)
        .map((c) => ({
          label: c.label.trim(),
          url: c.url.trim(),
          open_in_new_tab: c.open_in_new_tab !== false,
          bg_color: c.bg_color || "#1976d2",
          text_color: c.text_color || "#ffffff",
        })),
    }),
    [title, description, readMoreCollapsed, useExpiry, expiresLocal, ctas]
  );

  const performSave = async () => {
    if (!submitPayload.title) {
      setSnack({ message: "Title is required.", severity: "error" });
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`/api/dashboard/announcements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Update failed.");
      } else {
        const res = await fetch("/api/dashboard/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Create failed.");
      }
      setSnack({ message: editingId ? "Notification updated." : "Notification created.", severity: "success" });
      closeDialog();
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const requestSave = () => {
    if (editingId) setConfirmSaveEdit(true);
    else void performSave();
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setSnack({ message: "Notification deleted.", severity: "success" });
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const performDismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}/dismiss`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not remove.");
      setSnack({ message: "Removed from your list.", severity: "success" });
      setConfirmDismissId(null);
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const setRead = async (id: string, read: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/announcements/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update read state.");
      await load();
    } catch (e) {
      setSnack({ message: e instanceof Error ? e.message : "Error", severity: "error" });
    }
  };

  const addCtaRow = () => {
    if (ctas.length >= 3) return;
    setCtas((prev) => [...prev, emptyCta()]);
  };

  const updateCta = (i: number, patch: Partial<AnnouncementCta>) => {
    setCtas((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  };

  const removeCta = (i: number) => {
    setCtas((prev) => prev.filter((_, j) => j !== i));
  };

  return (
    <Box sx={{ maxWidth: 920, mx: "auto" }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        {canManage ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: "flex-start" }}>
            Add new notification
          </Button>
        ) : null}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <NotificationsActiveOutlinedIcon sx={{ color: "primary.main", fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.3 }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canManage
                ? "Create announcements for leaders and members. Expired items are hidden automatically."
                : "Stay up to date with announcements from your organization."}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,215,0,0.12)",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">No notifications right now.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {items.map((row) => {
            const unread = !row.read_at;
            const expanded = expandedDesc[row.id];
            const useCollapse = row.read_more_collapsed && row.description.length > PREVIEW_CHARS;
            const shownText =
              useCollapse && !expanded ? `${row.description.slice(0, PREVIEW_CHARS).trim()}…` : row.description;

            return (
              <Paper
                key={row.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "rgba(12,14,20,0.75)",
                  border: "1px solid rgba(255,215,0,0.14)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: unread ? "primary.main" : "rgba(255,255,255,0.15)",
                  },
                }}
              >
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ pl: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 700, color: "grey.100" }}>
                        {row.title}
                      </Typography>
                      {unread ? <Chip size="small" label="Unread" color="primary" variant="outlined" /> : null}
                      {row.expires_at ? (
                        <Chip
                          size="small"
                          label={`Expires ${new Date(row.expires_at).toLocaleString()}`}
                          variant="outlined"
                          sx={{ borderColor: "rgba(255,255,255,0.25)", color: "grey.400" }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="No expiry"
                          variant="outlined"
                          sx={{ borderColor: "rgba(255,255,255,0.2)", color: "grey.500" }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ color: "grey.300", whiteSpace: "pre-wrap", lineHeight: 1.65, mb: row.ctas?.length ? 2 : 0 }}
                    >
                      {shownText}
                    </Typography>
                    {useCollapse ? (
                      <Button
                        size="small"
                        onClick={() => setExpandedDesc((m) => ({ ...m, [row.id]: !expanded }))}
                        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ mt: 0.5, color: "primary.light", textTransform: "none" }}
                      >
                        {expanded ? "Read less" : "Read more"}
                      </Button>
                    ) : null}

                    {row.ctas?.length ? (
                      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                        {row.ctas.map((c, idx) => (
                          <Button
                            key={`${row.id}-cta-${idx}`}
                            component="a"
                            href={c.url}
                            target={c.open_in_new_tab !== false ? "_blank" : undefined}
                            rel={c.open_in_new_tab !== false ? "noopener noreferrer" : undefined}
                            variant="contained"
                            disableElevation
                            sx={{
                              bgcolor: c.bg_color,
                              color: c.text_color,
                              "&:hover": { bgcolor: c.bg_color, filter: "brightness(1.08)" },
                              textTransform: "none",
                              fontWeight: 600,
                            }}
                          >
                            {c.label}
                          </Button>
                        ))}
                      </Stack>
                    ) : null}
                  </Box>
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                  {unread ? (
                    <Button size="small" variant="outlined" onClick={() => void setRead(row.id, true)}>
                      Mark as read
                    </Button>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => void setRead(row.id, false)}>
                      Mark as unread
                    </Button>
                  )}
                  <Button size="small" color="warning" variant="outlined" onClick={() => setConfirmDismissId(row.id)}>
                    Remove from my list
                  </Button>
                  {canManage ? (
                    <>
                      <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setConfirmDeleteId(row.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          {editingId ? "Edit notification" : "New notification"}
          <IconButton aria-label="Close" onClick={closeDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.25}>
            <TextField label="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={4}
            />
            <FormControlLabel
              control={<Switch checked={readMoreCollapsed} onChange={(_, v) => setReadMoreCollapsed(v)} />}
              label="Read more / Read less (long descriptions collapse)"
            />
            <FormControlLabel
              control={<Switch checked={useExpiry} onChange={(_, v) => setUseExpiry(v)} />}
              label="Set expiration"
            />
            {useExpiry ? (
              <TextField
                label="Expires"
                type="datetime-local"
                value={expiresLocal}
                onChange={(e) => setExpiresLocal(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            ) : null}

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <Typography variant="subtitle2" color="text.secondary">
              Call to actions (max 3)
            </Typography>
            {ctas.map((c, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.12)" }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="primary.main">
                      Button {i + 1}
                    </Typography>
                    <Button size="small" color="inherit" onClick={() => removeCta(i)}>
                      Remove
                    </Button>
                  </Stack>
                  <TextField
                    size="small"
                    label="Label"
                    value={c.label}
                    onChange={(e) => updateCta(i, { label: e.target.value })}
                    fullWidth
                  />
                  <TextField size="small" label="URL" value={c.url} onChange={(e) => updateCta(i, { url: e.target.value })} fullWidth />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={c.open_in_new_tab !== false}
                        onChange={(_, v) => updateCta(i, { open_in_new_tab: v })}
                      />
                    }
                    label="Open in new tab"
                  />
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ minWidth: 90 }}>
                      Background
                    </Typography>
                    <input
                      type="color"
                      value={c.bg_color}
                      onChange={(e) => updateCta(i, { bg_color: e.target.value })}
                      style={{ width: 48, height: 36, border: "none", borderRadius: 4, cursor: "pointer" }}
                    />
                    <Typography variant="caption" sx={{ minWidth: 70 }}>
                      Text
                    </Typography>
                    <input
                      type="color"
                      value={c.text_color}
                      onChange={(e) => updateCta(i, { text_color: e.target.value })}
                      style={{ width: 48, height: 36, border: "none", borderRadius: 4, cursor: "pointer" }}
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {ctas.length < 3 ? (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addCtaRow} sx={{ alignSelf: "flex-start" }}>
                Add call to action
              </Button>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={requestSave}>
            {editingId ? "Save changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmSaveEdit)} onClose={() => setConfirmSaveEdit(false)}>
        <DialogTitle>Save changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will update the notification for all users who can see it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSaveEdit(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmSaveEdit(false);
              void performSave();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Delete notification?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This permanently removes the announcement for everyone. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => confirmDeleteId && void performDelete(confirmDeleteId)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDismissId)} onClose={() => setConfirmDismissId(null)}>
        <DialogTitle>Remove from your list?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You can no longer see this announcement. Other users are not affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDismissId(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => confirmDismissId && void performDismiss(confirmDismissId)}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
