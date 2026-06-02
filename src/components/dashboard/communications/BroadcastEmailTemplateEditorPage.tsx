"use client";

import { CommunicationsNavTabs } from "@/components/dashboard/communications/CommunicationsNavTabs";
import { EmailTemplateRichEditor } from "@/components/dashboard/communications/EmailTemplateRichEditor";
import { DEFAULT_SHORTCODES_HELP, type BroadcastTemplateRow } from "@/lib/broadcast/types";
import { DEFAULT_EMAIL_TEMPLATE_HTML } from "@/lib/broadcast/email-template-html";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeIcon from "@mui/icons-material/Code";
import EditNoteIcon from "@mui/icons-material/EditNote";
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 4 }}>
      <CommunicationsNavTabs />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
        <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: "rgba(0,0,0,0.45)" }}>
          <Stack spacing={2.5}>
            <TextField
              label="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email subject line"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              fullWidth
              helperText='Example: "Hello {user_first_name}" — this is what recipients see in their inbox.'
            />

            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Email message
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={mode}
                  onChange={(_, v) => handleModeChange(v as EditorMode | null)}
                  aria-label="Editor mode"
                >
                  <ToggleButton value="visual">
                    <EditNoteIcon fontSize="small" sx={{ mr: 0.75 }} />
                    Easy editor
                  </ToggleButton>
                  <ToggleButton value="html">
                    <CodeIcon fontSize="small" sx={{ mr: 0.75 }} />
                    HTML code
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {mode === "visual" ? (
                <EmailTemplateRichEditor
                  value={form.body_html}
                  onChange={(html) => setForm((f) => ({ ...f, body_html: html }))}
                />
              ) : (
                <Stack spacing={1}>
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    For technical users only. Most people should use the Easy editor.
                  </Alert>
                  <TextField
                    value={form.body_html}
                    onChange={(e) => setForm((f) => ({ ...f, body_html: e.target.value }))}
                    multiline
                    fullWidth
                    minRows={18}
                    placeholder={DEFAULT_EMAIL_TEMPLATE_HTML}
                    sx={{
                      "& textarea": {
                        fontFamily: "ui-monospace, Menlo, monospace",
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                      },
                    }}
                  />
                </Stack>
              )}
            </Box>

            <TextField
              label="Shortcodes reference (optional)"
              value={form.shortcodes_help}
              onChange={(e) => setForm((f) => ({ ...f, shortcodes_help: e.target.value }))}
              fullWidth
              size="small"
              helperText="Internal note for your team; not shown to recipients."
            />
          </Stack>
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
