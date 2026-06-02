"use client";

import { DEFAULT_SHORTCODES_HELP, type BroadcastChannel, type BroadcastTemplateRow } from "@/lib/broadcast/types";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Snack = { message: string; severity: "success" | "error" };

export function BroadcastTemplatesClient({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [channelTab, setChannelTab] = useState<BroadcastChannel>("email");
  const [templates, setTemplates] = useState<BroadcastTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<Snack | null>(null);

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
    if (channelTab === "email") {
      router.push("/dashboard/communications/templates/new");
    } else {
      router.push("/dashboard/communications/templates/sms/new");
    }
  }

  function openEdit(t: BroadcastTemplateRow) {
    if (t.channel === "email") {
      router.push(`/dashboard/communications/templates/${t.id}/edit`);
    } else {
      router.push(`/dashboard/communications/templates/sms/${t.id}/edit`);
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
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

      {channelTab === "email" && canManage ? (
        <Alert severity="info">
          Email templates open in a full-page visual builder with drag-and-drop blocks and an HTML code
          editor.
        </Alert>
      ) : null}

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
                <Box sx={{ minWidth: 0, flex: 1 }}>
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

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Stack>
  );
}
