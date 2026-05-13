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
    if (gmailConnected) setOk("Google account connected. You can send a test email from the Templates tab.");
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
      setOk("Variables del servidor guardadas.");
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
      setOk("Guardado.");
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
      setOk("Clave de cifrado eliminada de la base de datos (se usará EMAIL_SECRETS_KEY en el servidor si existe).");
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

  if (loading && !summary) {
    return (
      <Typography color="text.secondary">
        Loading delivery settings…
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Solo super admin. Elige cómo el servidor envía el correo transaccional. Las variables que antes iban solo en
        entorno (URL pública y clave de cifrado) puedes definirlas aquí; siguen existiendo los fallbacks por variables
        de entorno si lo prefieres.
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
          Variables del servidor (visual)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          Sustituyen a <code>NEXT_PUBLIC_APP_URL</code> y a la clave de <code>EMAIL_SECRETS_KEY</code> cuando las
          rellenas. Se guardan en base de datos (solo el backend con service role las lee).
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="URL base de la aplicación"
            value={appBaseUrl}
            onChange={(e) => setAppBaseUrl(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder="https://tu-dominio.com"
            helperText="Sin barra final. Define la raíz pública del dashboard para construir la URL de redirección OAuth."
          />
          <TextField
            label="Clave para cifrar secretos Gmail (passphrase)"
            type="password"
            value={encryptionPassphrase}
            onChange={(e) => setEncryptionPassphrase(e.target.value)}
            fullWidth
            disabled={saving}
            placeholder={
              summary?.has_encryption_passphrase
                ? "•••••••• (dejar vacío para no cambiar)"
                : "Obligatoria si no usas EMAIL_SECRETS_KEY en el servidor"
            }
            autoComplete="new-password"
            helperText={
              summary?.has_encryption_passphrase
                ? "Ya hay una clave guardada. Escribe una nueva solo si quieres cambiarla (luego tendrás que volver a guardar el Client Secret y reconectar Google)."
                : "Si también tienes EMAIL_SECRETS_KEY en el entorno, puedes dejar esto vacío y se usará la del servidor."
            }
          />
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button variant="contained" color="secondary" onClick={() => void saveServerVarsOnly()} disabled={saving}>
              {saving ? "Guardando…" : "Guardar variables del servidor"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => void clearStoredPassphrase()}
              disabled={saving || !summary?.has_encryption_passphrase}
            >
              Quitar clave guardada en BD
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Divider />

      <FormControl disabled={saving}>
        <Typography variant="subtitle2" gutterBottom>
          Método de envío
        </Typography>
        <RadioGroup
          value={provider}
          onChange={(_, v) => setProvider(v as "env_smtp" | "gmail_workspace_oauth")}
        >
          <FormControlLabel
            value="env_smtp"
            control={<Radio />}
            label="SMTP del servidor (variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)"
          />
          <FormControlLabel
            value="gmail_workspace_oauth"
            control={<Radio />}
            label="Google Workspace / Gmail (OAuth, estilo FluentSMTP)"
          />
        </RadioGroup>
      </FormControl>

      {provider === "gmail_workspace_oauth" ? (
        <Stack spacing={2}>
          <Alert severity="info">
            <Typography variant="body2" component="span" display="block" gutterBottom>
              <strong>URI de redirección autorizada</strong> (Google Cloud → Credenciales → OAuth cliente Web):
            </Typography>
            <Box component="code" sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>
              {summary?.oauth_redirect_uri ?? "—"}
            </Box>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Debe coincidir exactamente con la URL base configurada arriba (o con <code>NEXT_PUBLIC_APP_URL</code> /
              Vercel si no rellenas el campo).
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
            placeholder={summary?.has_client_secret ? "•••••••• (dejar vacío para no cambiar)" : ""}
            autoComplete="new-password"
          />
          <TextField
            label="Remitente From (opcional antes de conectar)"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            fullWidth
            disabled={saving}
            helperText="Tras conectar con Google se guarda el correo de la cuenta con la que iniciaste sesión."
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
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar ajustes de Google"}
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
              Conectar con Google
            </Button>
            <Button
              variant="text"
              color="warning"
              onClick={() => void disconnectGmail()}
              disabled={saving || !summary?.has_refresh_token}
            >
              Desconectar token Gmail
            </Button>
          </Stack>
          {!encryptionReady ? (
            <Typography variant="caption" color="warning.main">
              Indica la clave de cifrado arriba (o configura EMAIL_SECRETS_KEY en el servidor) antes de usar «Conectar
              con Google».
            </Typography>
          ) : null}

          <Typography variant="caption" color="text.secondary">
            Guía similar:{" "}
            <Link href="https://fluentsmtp.com/docs/connect-gmail-or-google-workspace-emails-with-fluentsmtp/" target="_blank" rel="noopener noreferrer">
              FluentSMTP — Gmail / Google Workspace
            </Link>
            . Los tokens se cifran con la passphrase de este módulo o con <code>EMAIL_SECRETS_KEY</code>.
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Con SMTP del servidor, configura <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>,{" "}
          <code>SMTP_FROM</code> y opcionalmente <code>SMTP_PORT</code> / <code>SMTP_SECURE</code> en el entorno de
          despliegue. Pulsa «Guardar variables del servidor» si cambiaste la URL base arriba, luego «Guardar» aquí solo
          confirma el método.
        </Typography>
      )}

      {provider === "env_smtp" ? (
        <Button variant="contained" onClick={() => void saveServerVarsOnly()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar método de envío"}
        </Button>
      ) : null}

      {summary?.has_refresh_token ? (
        <Alert severity="success">
          Gmail OAuth activo. Remitente: <strong>{summary.gmail_sender_email || "—"}</strong>
        </Alert>
      ) : null}
    </Stack>
  );
}
