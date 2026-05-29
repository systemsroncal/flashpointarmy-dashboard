"use client";

import {
  DEFAULT_SHORTCODES_HELP,
  type BroadcastChannel,
  type BroadcastTemplateRow,
} from "@/lib/broadcast/types";
import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type Snack = { message: string; severity: "success" | "error" };

const PREVIEW_SHORTCODES: Record<string, string> = {
  user_fullname: "Jane Doe",
  user_first_name: "Jane",
  user_last_name: "Doe",
  user_email: "jane@example.com",
  user_phone: "+15551234567",
  chapter_name: "Austin Chapter",
  app_name: "Flashpoint Dashboard",
  current_year: String(new Date().getFullYear()),
};

function emptyForm(channel: BroadcastChannel) {
  return {
    name: "",
    channel,
    subject: channel === "email" ? "Hello {user_first_name}" : "",
    body_html:
      channel === "email"
        ? "<p>Hello {user_fullname},</p><p>Your message here.</p>"
        : "",
    body_text:
      channel === "sms" ? "Hello {user_first_name}, your message here." : "",
    shortcodes_help: DEFAULT_SHORTCODES_HELP,
  };
}

export function BroadcastTemplatesClient({ canManage }: { canManage: boolean }) {
  const [channelTab, setChannelTab] = useState<BroadcastChannel>("email");
  const [templates, setTemplates] = useState<BroadcastTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BroadcastTemplateRow | null>(null);
  const [form, setForm] = useState(emptyForm("email"));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/broadcast/templates?channel=${channelTab}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setTemplates(data.templates ?? []);
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Failed to load templates",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [channelTab]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(channelTab));
    setDialogOpen(true);
  }

  function openEdit(t: BroadcastTemplateRow) {
    setEditing(t);
    setForm({
      name: t.name,
      channel: t.channel,
      subject: t.subject ?? "",
      body_html: t.body_html ?? "",
      body_text: t.body_text,
      shortcodes_help: t.shortcodes_help ?? DEFAULT_SHORTCODES_HELP,
    });
    setDialogOpen(true);
  }

  async function saveTemplate() {
    if (!canManage) return;
    setSaving(true);
    try {
      const payload = { ...form, channel: channelTab };
      const url = editing ? `/api/broadcast/templates/${editing.id}` : "/api/broadcast/templates";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setDialogOpen(false);
      setSnack({ message: editing ? "Template updated" : "Template created", severity: "success" });
      await load();
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Save failed",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!canManage || !confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/broadcast/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setSnack({ message: "Template deleted", severity: "success" });
      await load();
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Delete failed",
        severity: "error",
      });
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Broadcast templates</Typography>
        {canManage && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
            New template
          </Button>
        )}
      </Stack>

      <Tabs value={channelTab} onChange={(_, v) => setChannelTab(v as BroadcastChannel)}>
        <Tab label="Email" value="email" />
        <Tab label="SMS" value="sms" />
      </Tabs>

      {!canManage && (
        <Alert severity="info">You can view templates. Only admins can create or edit them.</Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">No {channelTab} templates yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {templates.map((t) => (
            <Paper key={t.id} sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography fontWeight={600}>{t.name}</Typography>
                  {t.channel === "email" && t.subject && (
                    <Typography variant="body2" color="text.secondary">
                      Subject: {t.subject}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Shortcodes: {t.shortcodes_help ?? DEFAULT_SHORTCODES_HELP}
                  </Typography>
                </Box>
                {canManage && (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => openEdit(t)} aria-label="Edit">
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => void deleteTemplate(t.id)} aria-label="Delete">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Shortcodes help"
              value={form.shortcodes_help}
              onChange={(e) => setForm((f) => ({ ...f, shortcodes_help: e.target.value }))}
              fullWidth
              helperText="Available: {user_fullname}, {user_first_name}, {user_last_name}, {user_email}, {user_phone}, {chapter_name}, {app_name}, {current_year}"
            />
            {channelTab === "email" ? (
              <>
                <TextField
                  label="Subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  fullWidth
                />
                <Typography variant="subtitle2">Body (HTML)</Typography>
                <GatheringDescriptionEditor
                  value={form.body_html}
                  onChange={(html) => setForm((f) => ({ ...f, body_html: html }))}
                />
              </>
            ) : (
              <TextField
                label="SMS message"
                value={form.body_text}
                onChange={(e) => setForm((f) => ({ ...f, body_text: e.target.value }))}
                multiline
                minRows={4}
                fullWidth
                helperText="160 chars recommended; shortcodes supported."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveTemplate()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Stack>
  );
}
