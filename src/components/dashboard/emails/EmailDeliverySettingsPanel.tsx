"use client";

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Link,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type DeliverySummary = {
  provider: string;
  gmail_client_id: string;
  has_client_secret: boolean;
  has_refresh_token: boolean;
  gmail_sender_email: string;
  app_base_url: string;
  has_encryption_passphrase: boolean;
  oauth_redirect_uri: string;
};

export function EmailDeliverySettingsPanel({
  gmailConnected,
  gmailError,
}: {
  gmailConnected?: boolean;
  gmailError?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [provider, setProvider] = useState<"env_smtp" | "gmail_workspace_oauth">("env_smtp");
  const [appBaseUrl, setAppBaseUrl] = useState("");
  const [encryptionPassphrase, setEncryptionPassphrase] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/email/delivery-settings");
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Failed to load.");
      setSummary(j);
      setProvider(j.provider === "gmail_workspace_oauth" ? "gmail_workspace_oauth" : "env_smtp");
      setAppBaseUrl(j.app_base_url ?? "");
      setClientId(j.gmail_client_id ?? "");
      setSenderEmail(j.gmail_sender_email ?? "");
      setClientSecret("");
      setEncryptionPassphrase("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (gmailConnected)
      setOk("Google account connected. You can send a test email from the Templates tab.");
    if (gmailError) {
      const labels: Record<string, string> = {
        no_refresh_token:
          "Google did not return a refresh token. Remove the app in Google Account permissions and try again, or ensure prompt=consent is used.",
        no_sender_email: "Could not read your Google account email after sign-in.",
        bad_state: "OAuth session expired. Try Connect again.",
        token_exchange: "Google rejected the authorization code.",
      };
      setErr(labels[gmailError] ?? `Google OAuth error: ${gmailError}`);
    }
  }, [gmailConnected, gmailError]);

  async function saveServerVarsOnly() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          app_base_url: appBaseUrl.trim() || null,
          ...(encryptionPassphrase.trim()
            ? { credentials_encryption_passphrase: encryptionPassphrase.trim() }
            : {}),
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setSummary(j);
      setEncryptionPassphrase("");
      setOk("Server variables saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveServerAndDelivery(extra?: { gmail_client_secret?: string; gmail_sender_email?: string }) {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          gmail_client_id: clientId.trim() || undefined,
          gmail_client_secret: extra?.gmail_client_secret,
          gmail_sender_email: extra?.gmail_sender_email ?? (senderEmail.trim() || undefined),
          app_base_url: appBaseUrl.trim() || null,
          ...(encryptionPassphrase.trim()
            ? { credentials_encryption_passphrase: encryptionPassphrase.trim() }
            : {}),
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setSummary(j);
      setClientSecret("");
      setEncryptionPassphrase("");
      setOk("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function clearStoredPassphrase() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          gmail_client_id: clientId.trim(),
          clear_encryption_passphrase: true,
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Update failed.");
      setSummary(j);
      setOk("Encryption passphrase removed from the database (EMAIL_SECRETS_KEY on the server will be used if set).");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnectGmail() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gmail_workspace_oauth",
          clear_gmail_refresh: true,
          gmail_client_id: clientId.trim(),
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Update failed.");
      setSummary(j);
      setOk("Disconnected Gmail refresh token. You can reconnect anytime.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const encryptionReady =
    Boolean(summary?.has_encryption_passphrase) || Boolean(encryptionPassphrase.trim());
  const needsEncryptionForNewSecret = Boolean(clientSecret.trim());
  const canSaveGoogleWithSecret = !needsEncryptionForNewSecret || encryptionReady;

  if (loading && !summary) {
    return <Typography color="text.secondary">Loading delivery settings…</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Super admin only. Choose how the server sends transactional email. Values that used to live only in
        environment variables (public URL and encryption passphrase) can be set here; environment fallbacks still
        apply if you prefer them.
      </Typography>

      {err ? (
        <Alert severity="error" onClose={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}
      {ok ? (
        <Alert severity="success" onClose={() => setOk(null)}>
          {ok}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)" }}>
        <Typography variant="subtitle1" gutterBottom>
          Server variables (visual)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          When set, these replace <code>NEXT_PUBLIC_APP_URL</code> and <code>EMAIL_SECRETS_KEY</code> for this
          feature. They are stored in the database (only the backend with the service role can read them).
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Application base URL"
            value={appBaseUrl}
            onChange={(e) => setAppBaseUrl(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder="https://your-domain.com"
            helperText="No trailing slash. Public dashboard root used to build the OAuth redirect URL."
          />
          <TextField
            label="Passphrase to encrypt Gmail secrets"
            type="password"
            value={encryptionPassphrase}
            onChange={(e) => setEncryptionPassphrase(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder={
              summary?.has_encryption_passphrase
                ? "•••••••• (leave blank to keep current)"
                : "Required if EMAIL_SECRETS_KEY is not set on the server"
            }
            autoComplete="new-password"
            helperText={
              summary?.has_encryption_passphrase
                ? "A passphrase is already stored. Enter a new one only to rotate it (you will need to save the Client Secret again and reconnect Google)."
                : "If EMAIL_SECRETS_KEY is set in the environment, you can leave this blank and the server value will be used."
            }
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button variant="contained" color="secondary" onClick={() => void saveServerVarsOnly()} disabled={saving}>
              {saving ? "Saving…" : "Save server variables"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => void clearStoredPassphrase()}
              disabled={saving || !summary?.has_encryption_passphrase}
            >
              Remove passphrase from database
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Divider />

      <FormControl disabled={saving}>
        <Typography variant="subtitle2" gutterBottom>
          Delivery method
        </Typography>
        <RadioGroup
          value={provider}
          onChange={(_, v) => setProvider(v as "env_smtp" | "gmail_workspace_oauth")}
        >
          <FormControlLabel
            value="env_smtp"
            control={<Radio />}
            label="Server SMTP (environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)"
          />
          <FormControlLabel
            value="gmail_workspace_oauth"
            control={<Radio />}
            label="Google Workspace / Gmail (OAuth, FluentSMTP-style)"
          />
        </RadioGroup>
      </FormControl>

      {provider === "gmail_workspace_oauth" ? (
        <Stack spacing={2}>
          <Alert severity="info">
            <Typography variant="body2" component="span" display="block" gutterBottom>
              <strong>Authorized redirect URI</strong> (Google Cloud → APIs & Services → Credentials → OAuth web
              client):
            </Typography>
            <Box component="code" sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>
              {summary?.oauth_redirect_uri ?? "—"}
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Must match exactly the base URL configured above (or <code>NEXT_PUBLIC_APP_URL</code> / Vercel if you
              leave the field empty).
            </Typography>
          </Alert>

          <TextField
            label="Google OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            fullWidth
            disabled={saving}
            autoComplete="off"
          />
          <TextField
            label="Google OAuth Client Secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder={summary?.has_client_secret ? "•••••••• (leave blank to keep current)" : ""}
            autoComplete="new-password"
          />
          <TextField
            label="From sender (optional before connect)"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            fullWidth
            disabled={saving}
            helperText="After connecting with Google, the signed-in account email is stored."
          />

          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            <Button
              variant="contained"
              onClick={() =>
                void saveServerAndDelivery({
                  gmail_client_secret: clientSecret.trim() || undefined,
                  gmail_sender_email: senderEmail.trim() || undefined,
                })
              }
              disabled={saving || !canSaveGoogleWithSecret}
            >
              {saving ? "Saving…" : "Save Google settings"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              href="/api/email/google/oauth/start"
              disabled={
                saving ||
                !summary?.has_client_secret ||
                !clientId.trim() ||
                !encryptionReady
              }
            >
              Connect with Google
            </Button>
            <Button
              variant="text"
              color="warning"
              onClick={() => void disconnectGmail()}
              disabled={saving || !summary?.has_refresh_token}
            >
              Disconnect Gmail token
            </Button>
          </Stack>
          {!encryptionReady ? (
            <Typography variant="caption" color="warning.main" component="div">
              Set an encryption passphrase under Server variables (or configure <code>EMAIL_SECRETS_KEY</code> on the
              server) before {needsEncryptionForNewSecret ? "saving a new Client Secret or " : ""}
              using Connect with Google.
            </Typography>
          ) : null}

          <Typography variant="caption" color="text.secondary">
            Guide:{" "}
            <Link
              href="https://fluentsmtp.com/docs/connect-gmail-or-google-workspace-emails-with-fluentsmtp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              FluentSMTP — Gmail / Google Workspace
            </Link>
            . Tokens are encrypted with this module&apos;s passphrase or <code>EMAIL_SECRETS_KEY</code>.
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          With server SMTP, set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>,{" "}
          <code>SMTP_FROM</code>, and optionally <code>SMTP_PORT</code> / <code>SMTP_SECURE</code> in your deployment
          environment. Click Save server variables if you changed the base URL above; then Save delivery method below
          to confirm.
        </Typography>
      )}

      {provider === "env_smtp" ? (
        <Button variant="contained" onClick={() => void saveServerVarsOnly()} disabled={saving}>
          {saving ? "Saving…" : "Save delivery method"}
        </Button>
      ) : null}

      {summary?.has_refresh_token ? (
        <Alert severity="success">
          Gmail OAuth active. Sender: <strong>{summary.gmail_sender_email || "—"}</strong>
        </Alert>
      ) : null}
    </Stack>
  );
}
