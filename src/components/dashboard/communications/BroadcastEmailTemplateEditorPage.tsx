"use client";

import { CommunicationsNavTabs } from "@/components/dashboard/communications/CommunicationsNavTabs";
import { EmailTemplateGrapesEditor } from "@/components/dashboard/communications/EmailTemplateGrapesEditor";
import { DEFAULT_SHORTCODES_HELP, type BroadcastTemplateRow } from "@/lib/broadcast/types";
import { DEFAULT_EMAIL_TEMPLATE_HTML } from "@/lib/broadcast/email-template-html";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeIcon from "@mui/icons-material/Code";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type EditorMode = "visual" | "html";

type FormState = {
  name: string;
  subject: string;
  body_html: string;
  shortcodes_help: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    subject: "Hello {user_first_name}",
    body_html: DEFAULT_EMAIL_TEMPLATE_HTML,
    shortcodes_help: DEFAULT_SHORTCODES_HELP,
  };
}

function formFromTemplate(t: BroadcastTemplateRow): FormState {
  return {
    name: t.name,
    subject: t.subject ?? "",
    body_html: t.body_html?.trim() || DEFAULT_EMAIL_TEMPLATE_HTML,
    shortcodes_help: t.shortcodes_help ?? DEFAULT_SHORTCODES_HELP,
  };
}

export function BroadcastEmailTemplateEditorPage({
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
  const [mode, setMode] = useState<EditorMode>("visual");
  const [visualMountKey, setVisualMountKey] = useState(0);
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
      if (!res.ok) throw new Error(data.error || "Failed to load template");
      const t = data.template as BroadcastTemplateRow;
      if (t.channel !== "email") {
        router.replace(`/dashboard/communications/templates/sms/${templateId}/edit`);
        return;
      }
      setForm(formFromTemplate(t));
      setVisualMountKey((k) => k + 1);
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

  function handleModeChange(next: EditorMode | null) {
    if (!next || next === mode) return;
    if (next === "visual") {
      setVisualMountKey((k) => k + 1);
    }
    setMode(next);
  }

  async function save() {
    if (!canManage) return;
    const name = form.name.trim();
    const subject = form.subject.trim();
    const bodyHtml = form.body_html.trim();
    if (!name || !subject || !bodyHtml) {
      setSnack({ message: "Name, subject, and body are required.", severity: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        channel: "email",
        subject,
        body_html: bodyHtml,
        body_text: "",
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: "auto", md: "calc(100vh - 140px)" },
        gap: 2,
      }}
    >
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
            {isEdit ? "Edit email template" : "New email template"}
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

      {loading ? (
        <Typography color="text.secondary">Loading template…</Typography>
      ) : (
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: 2,
            gap: 2,
            bgcolor: "rgba(0,0,0,0.45)",
            minHeight: 0,
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Email subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              fullWidth
              size="small"
              helperText="Shortcodes supported, e.g. {user_first_name}"
            />
            <TextField
              label="Shortcodes help"
              value={form.shortcodes_help}
              onChange={(e) => setForm((f) => ({ ...f, shortcodes_help: e.target.value }))}
              fullWidth
              size="small"
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Email body
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, v) => handleModeChange(v as EditorMode | null)}
              aria-label="Editor mode"
            >
              <ToggleButton value="visual">
                <ViewQuiltIcon fontSize="small" sx={{ mr: 0.75 }} />
                Visual builder
              </ToggleButton>
              <ToggleButton value="html">
                <CodeIcon fontSize="small" sx={{ mr: 0.75 }} />
                HTML code
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {mode === "visual"
              ? "Drag blocks from the right panel to build your email (similar to a page builder). Switch to HTML code to edit markup directly."
              : "Edit raw HTML. Switch back to Visual builder to continue with drag-and-drop blocks."}
          </Typography>

          <Box
            sx={{
              flex: 1,
              minHeight: { xs: 480, md: 520 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {mode === "visual" ? (
              <EmailTemplateGrapesEditor
                key={visualMountKey}
                mountKey={visualMountKey}
                initialHtml={form.body_html}
                onHtmlChange={(html) => setForm((f) => ({ ...f, body_html: html }))}
              />
            ) : (
              <TextField
                value={form.body_html}
                onChange={(e) => setForm((f) => ({ ...f, body_html: e.target.value }))}
                multiline
                fullWidth
                minRows={22}
                placeholder={DEFAULT_EMAIL_TEMPLATE_HTML}
                sx={{
                  flex: 1,
                  "& textarea": {
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                  },
                }}
              />
            )}
          </Box>
        </Paper>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Box>
  );
}
