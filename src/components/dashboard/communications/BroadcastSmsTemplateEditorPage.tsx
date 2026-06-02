"use client";

import { CommunicationsNavTabs } from "@/components/dashboard/communications/CommunicationsNavTabs";
import { DEFAULT_SHORTCODES_HELP, type BroadcastTemplateRow } from "@/lib/broadcast/types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type FormState = {
  name: string;
  body_text: string;
  shortcodes_help: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    body_text: "Hello {user_first_name}, your message here.",
    shortcodes_help: DEFAULT_SHORTCODES_HELP,
  };
}

export function BroadcastSmsTemplateEditorPage({
  templateId,
  canManage,
}: {
  templateId?: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(templateId);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ message: string; severity: "success" | "error" } | null>(
    null
  );

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/broadcast/templates/${templateId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const t = data.template as BroadcastTemplateRow;
      if (t.channel !== "sms") {
        router.replace(`/dashboard/communications/templates/${templateId}/edit`);
        return;
      }
      setForm({
        name: t.name,
        body_text: t.body_text,
        shortcodes_help: t.shortcodes_help ?? DEFAULT_SHORTCODES_HELP,
      });
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Failed to load",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [templateId, router]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  async function save() {
    if (!canManage) return;
    const name = form.name.trim();
    const bodyText = form.body_text.trim();
    if (!name || !bodyText) {
      setSnack({ message: "Name and message are required.", severity: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        channel: "sms",
        subject: "",
        body_html: "",
        body_text: bodyText,
        shortcodes_help: form.shortcodes_help.trim() || DEFAULT_SHORTCODES_HELP,
      };
      const url = isEdit
        ? `/api/broadcast/templates/${templateId}`
        : "/api/broadcast/templates";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSnack({ message: isEdit ? "Template updated" : "Template created", severity: "success" });
      router.push("/dashboard/communications/templates");
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Save failed",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <Box>
        <CommunicationsNavTabs />
        <Alert severity="info" sx={{ mt: 2 }}>
          You do not have permission to edit templates.
        </Alert>
        <Button component={Link} href="/dashboard/communications/templates" sx={{ mt: 2 }}>
          Back to templates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <CommunicationsNavTabs />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            component={Link}
            href="/dashboard/communications/templates"
            startIcon={<ArrowBackIcon />}
            size="small"
          >
            Templates
          </Button>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? "Edit SMS template" : "New SMS template"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/dashboard/communications/templates" disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving || loading}>
            {saving ? "Saving…" : "Save template"}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, bgcolor: "rgba(0,0,0,0.45)" }}>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <Stack spacing={2}>
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
            />
            <TextField
              label="SMS message"
              value={form.body_text}
              onChange={(e) => setForm((f) => ({ ...f, body_text: e.target.value }))}
              multiline
              minRows={8}
              fullWidth
              helperText="160 characters recommended; shortcodes supported."
            />
          </Stack>
        )}
      </Paper>

      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Box>
  );
}
