"use client";

import { renderTemplatedEmail } from "@/lib/mail/render-email";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useMemo, useState } from "react";

type Branding = {
  logo_url: string | null;
  logo_bg_color: string;
  container_bg_color: string;
  footer_html: string;
};

type TemplateRow = {
  id: string;
  template_key: string;
  subject: string;
  body_html: string;
};

const PREVIEW_SHORTCODES: Record<string, string> = {
  user_fullname: "Jane Doe",
  user_email: "jane@example.com",
  validateemail_url: "https://example.com/auth/verify?token=demo",
  resetpassword_url: "https://example.com/auth/reset-password?token=demo",
  gathering_title: "Sunday gathering",
  gathering_url: "https://example.com/dashboard/gatherings/demo",
  app_name: "Flashpoint Dashboard",
  current_year: String(new Date().getFullYear()),
  otp: "123456",
};

const TEMPLATE_LABELS: Record<string, string> = {
  verify_email: "Verify email",
  password_reset: "Password reset",
  local_leader_assigned: "Local leader assigned",
  gathering_created: "New gathering",
  register_otp: "Registration OTP (sign-up)",
};

export type EmailSendLogRow = {
  id: string;
  created_at: string;
  status: string;
  template_key: string | null;
  from_address: string | null;
  to_address: string;
  subject: string | null;
  body_preview: string | null;
  error_message: string | null;
  triggered_by_user_id: string | null;
};

const TEMPLATE_SHORTCODE_HINTS: Record<string, string> = {
  verify_email:
    "{user_fullname}, {user_email}, {validateemail_url}, {current_year}, {app_name}",
  password_reset:
    "{user_fullname}, {user_email}, {resetpassword_url}, {current_year}, {app_name}",
  local_leader_assigned:
    "{user_fullname}, {user_email}, {current_year}, {app_name}",
  gathering_created:
    "{user_fullname}, {user_email}, {gathering_title}, {gathering_url}, {current_year}, {app_name}",
  register_otp:
    "{otp}, {user_email}, {user_fullname}, {app_name}, {current_year} (link shortcodes unused)",
};

export function EmailsSettingsClient({
  initialBranding,
  initialTemplates,
  initialLogs,
  defaultTestEmail,
  canEdit,
}: {
  initialBranding: Branding;
  initialTemplates: TemplateRow[];
  initialLogs: EmailSendLogRow[];
  defaultTestEmail: string;
  canEdit: boolean;
}) {
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [selectedKey, setSelectedKey] = useState(
    initialTemplates[0]?.template_key ?? "verify_email"
  );

  const currentTpl = templates.find((t) => t.template_key === selectedKey);
  const [subject, setSubject] = useState(currentTpl?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(currentTpl?.body_html ?? "");

  const [savingBrand, setSavingBrand] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState<EmailSendLogRow[]>(initialLogs);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [testSending, setTestSending] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [detailLog, setDetailLog] = useState<EmailSendLogRow | null>(null);
  const [previewLog, setPreviewLog] = useState<EmailSendLogRow | null>(null);

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  async function refreshLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/email/settings/logs");
      const data = (await res.json()) as { logs?: EmailSendLogRow[]; error?: string };
      if (res.ok && data.logs) setLogs(data.logs);
    } finally {
      setLogsLoading(false);
    }
  }

  async function sendTestEmail() {
    const to = testEmail.trim();
    if (!to || !to.includes("@")) {
      setErr("Enter a valid email for the test send.");
      return;
    }
    setTestSending(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/email/settings/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: selectedKey, to_email: to }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Test send failed");
      setMsg(`Test email sent to ${to} using template “${TEMPLATE_LABELS[selectedKey] ?? selectedKey}”.`);
      void refreshLogs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Test send failed");
    } finally {
      setTestSending(false);
    }
  }

  const handleSelectTemplate = (key: string) => {
    const t = templates.find((x) => x.template_key === key);
    setSelectedKey(key);
    setSubject(t?.subject ?? "");
    setBodyHtml(t?.body_html ?? "");
  };

  const brandingPreview = useMemo(() => {
    return renderTemplatedEmail(
      branding,
      {
        subject: "Preview subject",
        body_html:
          "<p>This is sample <strong>body</strong> content for branding preview.</p>",
      },
      PREVIEW_SHORTCODES
    );
  }, [branding]);

  const templatePreview = useMemo(() => {
    return renderTemplatedEmail(
      branding,
      { subject, body_html: bodyHtml },
      PREVIEW_SHORTCODES
    );
  }, [branding, subject, bodyHtml]);

  if (initialTemplates.length === 0) {
    return (
      <Alert severity="warning">
        No email templates were found. Apply migration 012 (email module) in Supabase and refresh
        this page.
      </Alert>
    );
  }

  async function saveBranding() {
    setErr(null);
    setMsg(null);
    setSavingBrand(true);
    try {
      const res = await fetch("/api/email/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: branding.logo_url?.trim() || null,
          logo_bg_color: branding.logo_bg_color,
          container_bg_color: branding.container_bg_color,
          footer_html: branding.footer_html,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Branding saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingBrand(false);
    }
  }

  async function saveTemplate() {
    setErr(null);
    setMsg(null);
    setSavingTpl(true);
    try {
      const res = await fetch("/api/email/settings/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_key: selectedKey,
          subject,
          body_html: bodyHtml,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setTemplates((prev) =>
        prev.map((t) =>
          t.template_key === selectedKey ? { ...t, subject, body_html: bodyHtml } : t
        )
      );
      setMsg("Template saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingTpl(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Email configuration</Typography>
      <Typography variant="body2" color="text.secondary">
        Global layout (logo area, colors, footer) wraps every transactional email. Each
        template only stores the inner HTML body and subject line.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Templates &amp; branding" />
        <Tab label="Email send log" />
      </Tabs>

      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      {tab === 1 ? (
        <Paper sx={{ p: 2, overflow: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Recent sends (SMTP)</Typography>
            <Button size="small" variant="outlined" onClick={() => void refreshLogs()} disabled={logsLoading}>
              {logsLoading ? "Loading…" : "Refresh"}
            </Button>
          </Stack>
          {logs.length === 0 ? (
            <Typography color="text.secondary">No log entries yet. Apply migration 015 if this table is missing.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Error</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        color={row.status === "sent" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {row.template_key
                        ? (TEMPLATE_LABELS[row.template_key] ?? row.template_key)
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.from_address ?? "—"}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.to_address}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, fontSize: "0.8rem" }}>{row.subject ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 220, fontSize: "0.72rem", verticalAlign: "top" }}>
                      {row.error_message ? (
                        <Typography color="error" component="span" sx={{ wordBreak: "break-word" }}>
                          {row.error_message}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="All details">
                        <IconButton
                          size="small"
                          aria-label="View full log details"
                          onClick={() => setDetailLog(row)}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Email preview (rendered)">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Preview email as sent"
                            onClick={() => setPreviewLog(row)}
                            disabled={!row.body_preview?.trim()}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      ) : null}

      {tab === 0 ? (
      <Fragment>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Branding &amp; layout
        </Typography>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }} useFlexGap>
            <TextField
              label="Logo image URL"
              fullWidth
              value={branding.logo_url ?? ""}
              onChange={(e) =>
                setBranding((b) => ({ ...b, logo_url: e.target.value || null }))
              }
              disabled={!canEdit}
              helperText="Public HTTPS URL. If empty, a text title is shown."
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Logo strip background"
                fullWidth
                value={branding.logo_bg_color}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, logo_bg_color: e.target.value }))
                }
                disabled={!canEdit}
              />
              <TextField
                label="Outer container background"
                fullWidth
                value={branding.container_bg_color}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, container_bg_color: e.target.value }))
                }
                disabled={!canEdit}
              />
            </Stack>
            <TextField
              label="Footer HTML"
              fullWidth
              multiline
              minRows={4}
              value={branding.footer_html}
              onChange={(e) =>
                setBranding((b) => ({ ...b, footer_html: e.target.value }))
              }
              disabled={!canEdit}
              helperText={`Shortcodes: {current_year}, {app_name}. Example: <p>© {current_year}</p>`}
            />
            <Button
              variant="contained"
              onClick={saveBranding}
              disabled={!canEdit || savingBrand}
            >
              {savingBrand ? "Saving…" : "Save branding"}
            </Button>
          </Stack>
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Live preview (sample body)
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 420,
                bgcolor: "grey.900",
              }}
            >
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: brandingPreview.html }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Divider />

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Message templates
        </Typography>
        <FormControl fullWidth sx={{ maxWidth: 400, mb: 2 }}>
          <InputLabel id="tpl-select">Template</InputLabel>
          <Select
            labelId="tpl-select"
            label="Template"
            value={selectedKey}
            onChange={(e) => handleSelectTemplate(e.target.value)}
          >
            {templates.map((t) => (
              <MenuItem key={t.template_key} value={t.template_key}>
                {TEMPLATE_LABELS[t.template_key] ?? t.template_key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Shortcodes for this template: {TEMPLATE_SHORTCODE_HINTS[selectedKey] ?? "—"}
        </Typography>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }} useFlexGap>
            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!canEdit}
            />
            <TextField
              label="Body HTML"
              fullWidth
              multiline
              minRows={12}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              disabled={!canEdit}
              InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
            />
            <Button
              variant="contained"
              onClick={saveTemplate}
              disabled={!canEdit || savingTpl}
            >
              {savingTpl ? "Saving…" : "Save template"}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Test send (current template)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Uses sample shortcodes (Jane D., demo links). Saves appear in the Email send log tab.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <TextField
                label="Send test to"
                type="email"
                size="small"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={!canEdit}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Button
                variant="outlined"
                onClick={() => void sendTestEmail()}
                disabled={!canEdit || testSending}
              >
                {testSending ? "Sending…" : "Send test email"}
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Live preview (subject: {templatePreview.subject})
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 520,
                bgcolor: "grey.900",
              }}
            >
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: templatePreview.html }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
      </Fragment>
      ) : null}

      <Dialog
        open={detailLog != null}
        onClose={() => setDetailLog(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Email send log — full details</DialogTitle>
        <DialogContent dividers>
          {detailLog ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Log ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {detailLog.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created at
                </Typography>
                <Typography variant="body2">{new Date(detailLog.created_at).toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">{detailLog.status}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Template key
                </Typography>
                <Typography variant="body2">
                  {detailLog.template_key
                    ? (TEMPLATE_LABELS[detailLog.template_key] ?? detailLog.template_key)
                    : "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  From (SMTP)
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {detailLog.from_address ?? "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  To
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {detailLog.to_address}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Subject
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  {detailLog.subject ?? "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Error description
                </Typography>
                <Typography
                  variant="body2"
                  color={detailLog.error_message ? "error" : "text.secondary"}
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {detailLog.error_message ?? "— (no error — send succeeded or error not recorded)"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Triggered by user ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {detailLog.triggered_by_user_id ?? "—"}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Body HTML (full, as logged)
                </Typography>
                <TextField
                  value={detailLog.body_preview ?? ""}
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={20}
                  InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: 12 } }}
                  placeholder="No body was stored for this row."
                />
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewLog != null}
        onClose={() => setPreviewLog(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Email preview</DialogTitle>
        <DialogContent>
          {previewLog ? (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                <strong>Subject:</strong> {previewLog.subject ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>To:</strong> {previewLog.to_address}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Rendered HTML in an isolated frame (no scripts). This approximates how the message looks in a mail
                client.
              </Typography>
              {previewLog.body_preview?.trim() ? (
                <Box
                  sx={{
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "grey.100",
                  }}
                >
                  <iframe
                    title="Email HTML preview"
                    srcDoc={previewLog.body_preview}
                    sandbox=""
                    style={{
                      width: "100%",
                      height: 560,
                      border: "none",
                      display: "block",
                      background: "#ffffff",
                    }}
                  />
                </Box>
              ) : (
                <Typography color="text.secondary">No HTML body was logged for this entry.</Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
