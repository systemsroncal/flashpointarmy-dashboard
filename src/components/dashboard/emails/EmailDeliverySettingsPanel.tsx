"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
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

/** Shown when a secret exists in the database (value is never sent to the browser). */
const STORED_SECRET_MASK = "******";

type DeliverySummary = {
  provider: string;
  gmail_client_id: string;
  /** Server env: `GMAIL_OAUTH_CLIENT_SECRET` or `GOOGLE_OAUTH_CLIENT_SECRET` (never sent to the browser). */
  gmail_client_secret_from_env: boolean;
  has_client_secret: boolean;
  has_stored_db_client_secret: boolean;
  has_refresh_token: boolean;
  gmail_sender_email: string;
  app_base_url: string;
  has_encryption_passphrase: boolean;
  oauth_redirect_uri: string;
  smtp_host: string;
  smtp_port: number | null;
  smtp_secure: boolean;
  smtp_auth_user: string;
  smtp_from_email: string;
  smtp_from_name: string;
  has_smtp_password: boolean;
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
  const [provider, setProvider] = useState<"env_smtp" | "gmail_workspace_oauth" | "dashboard_smtp">("env_smtp");
  const [appBaseUrl, setAppBaseUrl] = useState("");
  const [encryptionPassphrase, setEncryptionPassphrase] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpAuthUser, setSmtpAuthUser] = useState("");
  const [smtpAuthPass, setSmtpAuthPass] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
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
      setProvider(
        j.provider === "gmail_workspace_oauth"
          ? "gmail_workspace_oauth"
          : j.provider === "dashboard_smtp"
            ? "dashboard_smtp"
            : "env_smtp"
      );
      setAppBaseUrl(j.app_base_url ?? "");
      setClientId(j.gmail_client_id ?? "");
      setSenderEmail(j.gmail_sender_email ?? "");
      setSmtpHost(j.smtp_host ?? "");
      setSmtpPort(j.smtp_port != null && j.smtp_port > 0 ? String(j.smtp_port) : "587");
      setSmtpSecure(Boolean(j.smtp_secure));
      setSmtpAuthUser(j.smtp_auth_user ?? "");
      setSmtpFromEmail(j.smtp_from_email ?? "");
      setSmtpFromName(j.smtp_from_name ?? "");
      setClientSecret("");
      setSmtpAuthPass("");
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
        no_client_id: "Save the Google OAuth Client ID in Emails → Sending, then try Connect again.",
        no_encryption:
          "Missing encryption key: set the passphrase under Server variables or define EMAIL_SECRETS_KEY on the server.",
        decrypt_client_secret:
          "Could not decrypt the Client Secret (wrong passphrase vs when it was saved, or different EMAIL_SECRETS_KEY in production). Use “Remove stored Client Secret”, paste the secret again, save, then Connect.",
        no_client_secret:
          "No OAuth Client Secret: set GMAIL_OAUTH_CLIENT_SECRET or GOOGLE_OAUTH_CLIENT_SECRET in the server environment (.env.production / Vercel), or paste the secret here and save (legacy).",
        oauth_state_secret:
          "Server is missing a signing key for OAuth. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or EMAIL_OAUTH_STATE_SECRET in the deployment environment.",
        start_failed: "Could not start Google sign-in. Check server logs or try again.",
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

  async function clearStoredGoogleClientSecret() {
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
          clear_gmail_client_secret: true,
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Update failed.");
      setSummary(j);
      setClientSecret("");
      setOk(
        "Stored OAuth Client Secret removed. Paste the Client Secret from Google Cloud again, click Save Google settings, then Connect with Google."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDashboardSmtp() {
    setSaving(true);
    setErr(null);
    setOk(null);
    if (!smtpHost.trim() || !smtpAuthUser.trim() || !smtpFromEmail.trim()) {
      setErr("SMTP host, SMTP login (username), and sender email are required.");
      setSaving(false);
      return;
    }
    const portParsed = smtpPort.trim() ? Number.parseInt(smtpPort.trim(), 10) : 587;
    if (!Number.isFinite(portParsed) || portParsed < 1 || portParsed > 65535) {
      setErr("SMTP port must be a number between 1 and 65535.");
      setSaving(false);
      return;
    }
    const hasStored = Boolean(summary?.has_smtp_password);
    if (!hasStored && !smtpAuthPass.trim()) {
      setErr("Enter the SMTP password once so it can be stored encrypted (or use Environment SMTP / Gmail OAuth).");
      setSaving(false);
      return;
    }
    if (smtpAuthPass.trim() && !encryptionReady) {
      setErr("Set an encryption passphrase (or EMAIL_SECRETS_KEY on the server) before saving a new SMTP password.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "dashboard_smtp",
          app_base_url: appBaseUrl.trim() || null,
          ...(encryptionPassphrase.trim()
            ? { credentials_encryption_passphrase: encryptionPassphrase.trim() }
            : {}),
          smtp_host: smtpHost.trim(),
          smtp_port: portParsed,
          smtp_secure: smtpSecure,
          smtp_auth_user: smtpAuthUser.trim(),
          smtp_from_email: smtpFromEmail.trim(),
          smtp_from_name: smtpFromName.trim() || null,
          ...(smtpAuthPass.trim() ? { smtp_auth_pass: smtpAuthPass.trim() } : {}),
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Save failed.");
      setSummary(j);
      setSmtpAuthPass("");
      setEncryptionPassphrase("");
      setOk("Dashboard SMTP settings saved. Sender name and email are used for the From header.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function clearStoredSmtpPassword() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/email/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "dashboard_smtp",
          clear_smtp_auth_pass: true,
        }),
      });
      const j = (await res.json()) as DeliverySummary & { error?: string };
      if (!res.ok) throw new Error(j.error || "Update failed.");
      setSummary(j);
      setSmtpAuthPass("");
      setOk("Stored SMTP password removed. Enter a new password and save before sending mail.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const encryptionReady =
    Boolean(summary?.has_encryption_passphrase) || Boolean(encryptionPassphrase.trim());
  const needsEncryptionForNewSecret =
    Boolean(clientSecret.trim()) && summary?.gmail_client_secret_from_env !== true;
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
            label="Passphrase to encrypt Gmail & SMTP secrets"
            type="password"
            value={encryptionPassphrase}
            onChange={(e) => setEncryptionPassphrase(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder={
              summary?.has_encryption_passphrase
                ? `${STORED_SECRET_MASK} (leave blank to keep current)`
                : "Required if EMAIL_SECRETS_KEY is not set on the server"
            }
            autoComplete="new-password"
            helperText={
              summary?.has_encryption_passphrase
                ? `A passphrase is already stored (${STORED_SECRET_MASK}). Enter a new one only to rotate it (you will need to save the Client Secret again and reconnect Google).`
                : "If EMAIL_SECRETS_KEY is set in the environment, you can leave this blank and the server value will be used."
            }
          />
          {summary?.has_encryption_passphrase ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              Encryption passphrase on file: <Box component="code">{STORED_SECRET_MASK}</Box>
            </Typography>
          ) : null}
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
          onChange={(_, v) => setProvider(v as "env_smtp" | "gmail_workspace_oauth" | "dashboard_smtp")}
        >
          <FormControlLabel
            value="env_smtp"
            control={<Radio />}
            label="Server SMTP (environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)"
          />
          <FormControlLabel
            value="dashboard_smtp"
            control={<Radio />}
            label="Server SMTP (saved here: host, login, password, sender email & name)"
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
            <Typography variant="body2" component="div" gutterBottom>
              <strong>No SMTP user or password.</strong> After you save the OAuth client and click <em>Connect with
              Google</em>, the server sends mail through Gmail using <strong>OAuth2 only</strong> (FluentSMTP-style).
              The passphrase above encrypts the <strong>refresh token</strong> stored in the database; it is not your
              Gmail password.
            </Typography>
          </Alert>
          {summary?.gmail_client_secret_from_env ? (
            <Alert severity="success">
              <Typography variant="body2" component="div">
                OAuth <strong>Client Secret</strong> is read only from the server environment:{" "}
                <code>GMAIL_OAUTH_CLIENT_SECRET</code> or <code>GOOGLE_OAUTH_CLIENT_SECRET</code>. Do not paste it in
                this page—set it in <code>.env.production</code> / your host (e.g. Vercel) and redeploy.
              </Typography>
            </Alert>
          ) : null}
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
          {summary?.gmail_client_secret_from_env !== true ? (
            <>
              <TextField
                label="Google OAuth Client Secret (legacy — prefer env)"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                fullWidth
                disabled={saving}
                placeholder={
                  summary?.has_stored_db_client_secret
                    ? `${STORED_SECRET_MASK} (leave blank to keep current)`
                    : ""
                }
                helperText={
                  summary?.has_stored_db_client_secret
                    ? `A client secret is stored encrypted in the database (${STORED_SECRET_MASK}). Enter a new value only to replace it, or set GMAIL_OAUTH_CLIENT_SECRET in the server env and redeploy.`
                    : "Prefer setting GMAIL_OAUTH_CLIENT_SECRET on the server so the secret never transits the browser."
                }
                autoComplete="new-password"
              />
              {summary?.has_stored_db_client_secret ? (
                <Typography variant="caption" color="text.secondary">
                  OAuth client secret on file (database): <Box component="code">{STORED_SECRET_MASK}</Box>
                </Typography>
              ) : null}
              {summary?.has_stored_db_client_secret ? (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                  onClick={() => void clearStoredGoogleClientSecret()}
                  disabled={saving}
                >
                  Remove stored Client Secret
                </Button>
              ) : null}
            </>
          ) : null}
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
                  ...(summary?.gmail_client_secret_from_env !== true && clientSecret.trim()
                    ? { gmail_client_secret: clientSecret.trim() }
                    : {}),
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
      ) : null}

      {provider === "dashboard_smtp" ? (
        <Stack spacing={2}>
          <Alert severity="warning">
            <Typography variant="body2" component="div" gutterBottom>
              <strong>Error 535 / “Username and Password not accepted” (Gmail):</strong> use an{" "}
              <Link href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">
                App Password
              </Link>{" "}
              (not your normal password if 2-Step Verification is on). The <strong>SMTP login</strong> should match the
              Google account, and the <strong>sender email</strong> should be that account or an allowed “Send mail as”
              alias.
            </Typography>
          </Alert>
          <TextField
            label="SMTP host"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder="smtp.gmail.com"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              fullWidth
              disabled={saving}
              helperText="587 with TLS is typical; 465 often uses SSL (toggle below)."
            />
            <FormControlLabel
              sx={{ mt: { sm: 1 }, alignSelf: "center" }}
              control={
                <Checkbox checked={smtpSecure} onChange={(_, c) => setSmtpSecure(c)} disabled={saving} />
              }
              label="SSL / secure (nodemailer secure: true)"
            />
          </Stack>
          <TextField
            label="SMTP login (username)"
            value={smtpAuthUser}
            onChange={(e) => setSmtpAuthUser(e.target.value)}
            fullWidth
            disabled={saving}
            autoComplete="off"
            helperText="Usually the full email address for Gmail."
          />
          <TextField
            label="SMTP password"
            type="password"
            value={smtpAuthPass}
            onChange={(e) => setSmtpAuthPass(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder={
              summary?.has_smtp_password ? `${STORED_SECRET_MASK} (leave blank to keep current)` : ""
            }
            autoComplete="new-password"
            helperText={
              summary?.has_smtp_password
                ? `Password stored encrypted (${STORED_SECRET_MASK}). For Gmail use an App Password when 2FA is enabled.`
                : "Enter once to store encrypted. For Gmail use an App Password when 2FA is enabled."
            }
          />
          {summary?.has_smtp_password ? (
            <Typography variant="caption" color="text.secondary">
              SMTP password on file: <Box component="code">{STORED_SECRET_MASK}</Box>
            </Typography>
          ) : null}
          <TextField
            label="Sender email (From)"
            value={smtpFromEmail}
            onChange={(e) => setSmtpFromEmail(e.target.value)}
            fullWidth
            disabled={saving}
            autoComplete="off"
          />
          <TextField
            label="Sender display name (optional)"
            value={smtpFromName}
            onChange={(e) => setSmtpFromName(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder="Flash Point Army"
            helperText="Shown as the friendly From name; must align with your provider’s rules."
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button variant="contained" onClick={() => void saveDashboardSmtp()} disabled={saving}>
              {saving ? "Saving…" : "Save SMTP settings"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => void clearStoredSmtpPassword()}
              disabled={saving || !summary?.has_smtp_password}
            >
              Clear stored SMTP password
            </Button>
          </Stack>
        </Stack>
      ) : null}

      {provider === "env_smtp" ? (
        <Typography variant="body2" color="text.secondary">
          With environment SMTP, set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>,{" "}
          <code>SMTP_FROM</code> (can include a display name like <code>&quot;Name&quot; &lt;email@domain.com&gt;</code>
          ), and optionally <code>SMTP_PORT</code> / <code>SMTP_SECURE</code> in your deployment.{" "}
          <strong>
            If Gmail OAuth is fully connected in this dashboard (refresh token saved), the server sends through OAuth
            instead and does not use these SMTP variables.
          </strong>{" "}
          For Gmail SMTP via env only, <code>SMTP_USER</code> must match the account and you need an App Password if
          2FA is on. Click <strong>Save delivery method</strong> below to persist this choice.
        </Typography>
      ) : null}

      {provider === "env_smtp" ? (
        <Button variant="contained" onClick={() => void saveServerVarsOnly()} disabled={saving}>
          {saving ? "Saving…" : "Save delivery method"}
        </Button>
      ) : null}

      {provider === "dashboard_smtp" ? (
        <Button variant="outlined" onClick={() => void saveServerVarsOnly()} disabled={saving}>
          {saving ? "Saving…" : "Save delivery method only (no SMTP field changes)"}
        </Button>
      ) : null}

      {summary?.has_refresh_token ? (
        <Alert severity="success">
          Gmail OAuth active. Sender: <strong>{summary.gmail_sender_email || "—"}</strong>. Refresh token on file:{" "}
          <Box component="code" sx={{ fontWeight: 700 }}>
            {STORED_SECRET_MASK}
          </Box>
        </Alert>
      ) : null}
    </Stack>
  );
}
