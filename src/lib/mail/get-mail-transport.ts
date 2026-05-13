import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "@/utils/supabase/admin";
import type { EmailDeliveryRow } from "@/lib/mail/email-delivery-settings";
import { fetchEmailDeliverySettings, loadEncryptionPassphrase } from "@/lib/mail/email-delivery-settings";
import { hasGmailOAuthClientSecretInEnv } from "@/lib/mail/gmail-oauth-client-secret-env";
import { resolveGmailOAuthClientSecret } from "@/lib/mail/gmail-oauth-env";
import { getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";
import { decryptEmailSecret } from "@/lib/mail/email-secrets-crypto";

/** RFC 5322-style From with optional display name. */
export function formatMailFrom(displayName: string | null | undefined, email: string): string {
  const e = email.trim();
  if (!e) throw new Error("Sender email is empty.");
  const n = displayName?.trim();
  if (!n) return e;
  const escaped = n.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}" <${e}>`;
}

export type MailFromConfig = {
  transporter: Transporter;
  from: string;
};

/** OAuth can send mail when encrypted secrets + refresh token + sender exist in DB. */
function isGmailOAuthDeliveryReady(row: EmailDeliveryRow | null): boolean {
  if (!row) return false;
  const hasClientSecret =
    hasGmailOAuthClientSecretInEnv() || Boolean(row.gmail_client_secret_enc?.trim());
  return Boolean(
    row.gmail_client_id?.trim() &&
      hasClientSecret &&
      row.gmail_refresh_token_enc?.trim() &&
      row.gmail_sender_email?.trim()
  );
}

export async function getMailTransportAndFrom(): Promise<MailFromConfig> {
  const admin = createAdminClient();
  const row = await fetchEmailDeliverySettings(admin);

  if (row?.provider === "dashboard_smtp") {
    const host = row.smtp_host?.trim();
    const authUser = row.smtp_auth_user?.trim();
    const passEnc = row.smtp_auth_pass_enc?.trim();
    const fromEmail = row.smtp_from_email?.trim();
    if (!host || !authUser || !passEnc || !fromEmail) {
      throw new Error(
        "Dashboard SMTP is selected but host, SMTP login, password, or sender email is incomplete. Open Dashboard → Emails → Sending."
      );
    }
    const phrase = await loadEncryptionPassphrase(admin);
    let pass: string;
    try {
      pass = decryptEmailSecret(passEnc, phrase);
    } catch {
      throw new Error(
        "Could not decrypt the SMTP password. Set the same encryption passphrase used when it was saved, or enter a new SMTP password and save."
      );
    }
    const port = row.smtp_port != null && row.smtp_port > 0 ? row.smtp_port : 587;
    const secure = row.smtp_secure === true;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: authUser, pass },
    });
    return { transporter, from: formatMailFrom(row.smtp_from_name, fromEmail) };
  }

  /** Gmail OAuth only when selected in DB, or legacy fallback if provider is neither env nor dashboard nor oauth but OAuth is complete — never override explicit `env_smtp`. */
  const useGmailOAuth =
    row?.provider === "gmail_workspace_oauth" ||
    (row?.provider !== "env_smtp" &&
      row?.provider !== "dashboard_smtp" &&
      isGmailOAuthDeliveryReady(row));

  if (useGmailOAuth) {
    if (!row || !isGmailOAuthDeliveryReady(row)) {
      throw new Error(
        "Gmail / Google Workspace OAuth is selected but setup is incomplete. A super admin should open Dashboard → Emails → Sending, save the OAuth client, and connect Google."
      );
    }
    const oauthRow = row;
    const phrase = await loadEncryptionPassphrase(admin);
    const clientSecret = await resolveGmailOAuthClientSecret(admin, oauthRow);
    const refreshToken = oauthRow.gmail_refresh_token_enc?.trim()
      ? decryptEmailSecret(oauthRow.gmail_refresh_token_enc, phrase)
      : null;
    const clientId = oauthRow.gmail_client_id?.trim() ?? "";
    const sender = oauthRow.gmail_sender_email?.trim() ?? "";
    if (!clientId || !clientSecret || !refreshToken || !sender) {
      throw new Error(
        "Gmail OAuth data is incomplete. Open Dashboard → Emails → Sending and reconnect Google."
      );
    }
    const redirectUri = await getGmailOAuthRedirectUri(admin);
    const oauth2 = new OAuth2Client(clientId, clientSecret, redirectUri);
    oauth2.setCredentials({ refresh_token: refreshToken });
    const access = await oauth2.getAccessToken();
    const accessToken = access.token;
    if (!accessToken) {
      throw new Error("Failed to refresh Gmail access token. Reconnect Google in Emails → Sending.");
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: sender,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    });
    return { transporter, from: sender };
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  /** Gmail app passwords are shown as 4×4 with spaces; SMTP auth must use 16 chars without spaces. */
  const pass = (process.env.SMTP_PASS ?? "").trim().replace(/\s+/g, "");
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Connect Gmail (OAuth) under Emails → Sending, save dashboard SMTP, or set SMTP_HOST, SMTP_USER, and SMTP_PASS in the environment."
    );
  }
  const fromEnv = process.env.SMTP_FROM?.trim();
  if (!fromEnv) throw new Error("Missing SMTP_FROM.");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return { transporter, from: fromEnv };
}
