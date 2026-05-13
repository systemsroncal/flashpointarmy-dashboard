import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  decryptDeliverySecrets,
  fetchEmailDeliverySettings,
  loadEncryptionPassphrase,
} from "@/lib/mail/email-delivery-settings";
import { getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";

export type MailFromConfig = {
  transporter: Transporter;
  from: string;
};

export async function getMailTransportAndFrom(): Promise<MailFromConfig> {
  const admin = createAdminClient();
  const row = await fetchEmailDeliverySettings(admin);

  if (row?.provider === "gmail_workspace_oauth") {
    const phrase = await loadEncryptionPassphrase(admin);
    const { clientSecret, refreshToken } = decryptDeliverySecrets(row, phrase);
    const clientId = row.gmail_client_id?.trim() ?? "";
    const sender = row.gmail_sender_email?.trim() ?? "";
    if (!clientId || !clientSecret || !refreshToken || !sender) {
      throw new Error(
        "Gmail / Google Workspace OAuth is selected but setup is incomplete. A super admin should open Dashboard → Emails → Sending and connect Google."
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

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS, or choose Google Workspace (OAuth) in Emails → Sending."
    );
  }
  const from = process.env.SMTP_FROM;
  if (!from) throw new Error("Missing SMTP_FROM.");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return { transporter, from };
}
