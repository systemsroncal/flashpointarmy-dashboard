"use client";

import {
  AUDIENCE_LABELS,
  BROADCAST_AUDIENCES,
  EMAIL_PROVIDER_LABELS,
  type BroadcastAudience,
  type BroadcastChannel,
  type BroadcastTemplateRow,
  type EmailProvider,
} from "@/lib/broadcast/types";
import { GatheringDescriptionEditor } from "@/components/dashboard/gatherings/GatheringDescriptionEditor";
import SendIcon from "@mui/icons-material/Send";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

type Snack = { message: string; severity: "success" | "error" };
type Chapter = { id: string; name: string };
type ProviderInfo = {
  email: { id: EmailProvider; label: string; configured: boolean }[];
  sms: { id: string; label: string; configured: boolean }[];
};

export function BroadcastSendClient({ canSend }: { canSend: boolean }) {
  const [channel, setChannel] = useState<BroadcastChannel>("email");
  const [templates, setTemplates] = useState<BroadcastTemplateRow[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [providers, setProviders] = useState<ProviderInfo | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all_users");
  const [chapterId, setChapterId] = useState<string>("all");
  const [emailProvider, setEmailProvider] = useState<EmailProvider>("dashboard");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<
    { name: string; email: string | null; phone: string | null; roles: string[] }[]
  >([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snack, setSnack] = useState<Snack | null>(null);

  const loadTemplates = useCallback(async () => {
    const res = await fetch(`/api/broadcast/templates?channel=${channel}`);
    const data = await res.json();
    if (res.ok) setTemplates(data.templates ?? []);
  }, [channel]);

  useEffect(() => {
    void loadTemplates();
    setSelectedTemplateId("");
  }, [loadTemplates]);

  useEffect(() => {
    void (async () => {
      const [chRes, provRes] = await Promise.all([
        fetch("/api/broadcast/chapters"),
        fetch("/api/broadcast/providers"),
      ]);
      const chData = await chRes.json();
      const provData = await provRes.json();
      if (chRes.ok) setChapters(chData.chapters ?? chData ?? []);
      if (provRes.ok) setProviders(provData);
    })();
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  function applyTemplate(t: BroadcastTemplateRow | null) {
    if (!t) return;
    setSubject(t.subject ?? "");
    setBodyHtml(t.body_html ?? "");
    setBodyText(t.body_text ?? "");
  }

  function onSelectTemplate(id: string) {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id) ?? null;
    applyTemplate(t);
  }

  async function previewAudience() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/broadcast/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          audience: {
            audience,
            chapterId: chapterId === "all" ? null : chapterId,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreviewCount(data.count);
      setPreviewSample(data.sample ?? []);
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Preview failed",
        severity: "error",
      });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function sendCampaign() {
    if (!canSend) return;
    if (!confirm(`Send this ${channel} campaign to ${previewCount ?? "?"} recipients?`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/broadcast/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName || undefined,
          channel,
          template_id: selectedTemplateId || null,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          email_provider: emailProvider,
          audience: {
            audience,
            chapterId: chapterId === "all" ? null : chapterId,
          },
          send_now: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      const r = data.result;
      setSnack({
        message: `Sent: ${r?.sent ?? 0}, failed: ${r?.failed ?? 0}`,
        severity: r?.failed > 0 && r?.sent === 0 ? "error" : "success",
      });
    } catch (e) {
      setSnack({
        message: e instanceof Error ? e.message : "Send failed",
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  }

  const smsConfigured = providers?.sms[0]?.configured ?? false;
  const emailProviders = providers?.email ?? [];

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Send broadcast</Typography>

      {!canSend && (
        <Alert severity="info">You need send permissions to dispatch campaigns.</Alert>
      )}

      <Tabs value={channel} onChange={(_, v) => setChannel(v as BroadcastChannel)}>
        <Tab label="Email" value="email" />
        <Tab label="SMS (Twilio)" value="sms" />
      </Tabs>

      {channel === "sms" && !smsConfigured && (
        <Alert severity="warning">
          Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
          TWILIO_SMS_FROM in the server environment.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Campaign name (optional)"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            fullWidth
            size="small"
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Template</InputLabel>
              <Select
                label="Template"
                value={selectedTemplateId}
                onChange={(e) => onSelectTemplate(e.target.value)}
              >
                <MenuItem value="">
                  <em>Start from scratch</em>
                </MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {channel === "email" && (
              <FormControl fullWidth size="small">
                <InputLabel>Email provider</InputLabel>
                <Select
                  label="Email provider"
                  value={emailProvider}
                  onChange={(e) => setEmailProvider(e.target.value as EmailProvider)}
                >
                  {emailProviders.map((p) => (
                    <MenuItem key={p.id} value={p.id} disabled={!p.configured && p.id !== "dashboard"}>
                      {EMAIL_PROVIDER_LABELS[p.id]}
                      {!p.configured && p.id !== "dashboard" ? " (not configured)" : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>

          {selectedTemplate && (
            <Alert severity="info" icon={false}>
              Loaded template <strong>{selectedTemplate.name}</strong>. Edit the content below before
              sending.
            </Alert>
          )}

          {channel === "email" ? (
            <>
              <TextField
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
              />
              <Typography variant="subtitle2">Message body</Typography>
              <GatheringDescriptionEditor value={bodyHtml} onChange={setBodyHtml} />
            </>
          ) : (
            <TextField
              label="SMS message"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              multiline
              minRows={5}
              fullWidth
              helperText="Use shortcodes like {user_first_name}. Message is editable after selecting a template."
            />
          )}

          <Divider />

          <Typography variant="subtitle1">Audience</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role filter</InputLabel>
              <Select
                label="Role filter"
                value={audience}
                onChange={(e) => setAudience(e.target.value as BroadcastAudience)}
              >
                {BROADCAST_AUDIENCES.map((a) => (
                  <MenuItem key={a} value={a}>
                    {AUDIENCE_LABELS[a]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Chapter</InputLabel>
              <Select
                label="Chapter"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <MenuItem value="all">All chapters</MenuItem>
                {chapters.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={previewLoading ? <CircularProgress size={16} /> : <VisibilityOutlinedIcon />}
              onClick={() => void previewAudience()}
              disabled={previewLoading}
            >
              Preview recipients
            </Button>
            {previewCount != null && (
              <Chip label={`${previewCount} recipient${previewCount === 1 ? "" : "s"}`} color="primary" />
            )}
          </Stack>

          {previewSample.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sample:
              </Typography>
              {previewSample.map((s, i) => (
                <Typography key={i} variant="body2">
                  {s.name} — {channel === "email" ? s.email : s.phone} ({s.roles.join(", ")})
                </Typography>
              ))}
            </Box>
          )}

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setPreviewOpen(true)}>
              Preview message
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={() => void sendCampaign()}
              disabled={!canSend || sending || (channel === "sms" && !smsConfigured)}
            >
              {sending ? "Sending…" : "Send now"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview (sample shortcodes)</DialogTitle>
        <DialogContent>
          {channel === "email" ? (
            <Box>
              <Typography variant="subtitle2">Subject</Typography>
              <Typography sx={{ mb: 2 }}>
                {subject.replace(/\{user_first_name\}/g, "Jane").replace(/\{user_fullname\}/g, "Jane Doe")}
              </Typography>
              <Typography variant="subtitle2">Body</Typography>
              <Box
                sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
                dangerouslySetInnerHTML={{
                  __html: bodyHtml
                    .replace(/\{user_first_name\}/g, "Jane")
                    .replace(/\{user_fullname\}/g, "Jane Doe")
                    .replace(/\{chapter_name\}/g, "Austin Chapter"),
                }}
              />
            </Box>
          ) : (
            <Typography sx={{ whiteSpace: "pre-wrap" }}>
              {bodyText
                .replace(/\{user_first_name\}/g, "Jane")
                .replace(/\{user_fullname\}/g, "Jane Doe")}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={8000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Stack>
  );
}
