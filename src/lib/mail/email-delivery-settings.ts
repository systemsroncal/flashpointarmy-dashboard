import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptEmailSecret, encryptEmailSecret } from "@/lib/mail/email-secrets-crypto";

export type EmailDeliveryProvider = "env_smtp" | "gmail_workspace_oauth" | "dashboard_smtp";

export type EmailDeliveryRow = {
  id: boolean;
  provider: EmailDeliveryProvider;
  gmail_client_id: string | null;
  gmail_client_secret_enc: string | null;
  gmail_refresh_token_enc: string | null;
  gmail_sender_email: string | null;
  app_base_url: string | null;
  credentials_encryption_passphrase: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_auth_user: string | null;
  smtp_auth_pass_enc: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  updated_at: string;
};

export async function fetchEmailDeliverySettings(admin: SupabaseClient): Promise<EmailDeliveryRow | null> {
  const { data, error } = await admin.from("email_delivery_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return null;
  return data as EmailDeliveryRow;
}

/** Passphrase: DB (visual settings) first, then `EMAIL_SECRETS_KEY` on the server. */
export async function loadEncryptionPassphrase(admin: SupabaseClient): Promise<string> {
  const row = await fetchEmailDeliverySettings(admin);
  const fromDb = row?.credentials_encryption_passphrase?.trim();
  const fromEnv = process.env.EMAIL_SECRETS_KEY?.trim();
  const v = fromDb || fromEnv;
  if (!v) {
    throw new Error(
      "Missing encryption passphrase: set it under Emails → Sending (Server variables) or define EMAIL_SECRETS_KEY in the server environment."
    );
  }
  return v;
}

export function decryptDeliverySecrets(
  row: EmailDeliveryRow,
  passphrase: string
): {
  clientSecret: string | null;
  refreshToken: string | null;
} {
  return {
    clientSecret: row.gmail_client_secret_enc ? decryptEmailSecret(row.gmail_client_secret_enc, passphrase) : null,
    refreshToken: row.gmail_refresh_token_enc ? decryptEmailSecret(row.gmail_refresh_token_enc, passphrase) : null,
  };
}

export type DeliverySettingsPatch = {
  provider: EmailDeliveryProvider;
  gmail_client_id?: string | null;
  /** Plain secret from UI; encrypted before storage. Omit or empty to leave unchanged. */
  gmail_client_secret?: string | null;
  gmail_sender_email?: string | null;
  /** Remove stored refresh token (disconnect Gmail). */
  clear_gmail_refresh?: boolean;
  /** Public site root for OAuth (e.g. https://dashboard.example.com). */
  app_base_url?: string | null;
  /** Plain passphrase stored in DB (optional if EMAIL_SECRETS_KEY is set on server). */
  credentials_encryption_passphrase?: string | null;
  /** When true, remove stored passphrase (fall back to EMAIL_SECRETS_KEY only). */
  clear_encryption_passphrase?: boolean;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_secure?: boolean | null;
  smtp_auth_user?: string | null;
  /** Plain SMTP password; encrypted before storage. Omit or empty to leave unchanged. */
  smtp_auth_pass?: string | null;
  smtp_from_email?: string | null;
  smtp_from_name?: string | null;
  clear_smtp_auth_pass?: boolean;
};

export async function upsertEmailDeliverySettings(
  admin: SupabaseClient,
  patch: DeliverySettingsPatch,
  userId: string | null
): Promise<void> {
  const existing = await fetchEmailDeliverySettings(admin);
  let clientSecretEnc = existing?.gmail_client_secret_enc ?? null;
  let refreshEnc = existing?.gmail_refresh_token_enc ?? null;
  let clientId = patch.gmail_client_id !== undefined ? patch.gmail_client_id?.trim() || null : existing?.gmail_client_id ?? null;
  let sender =
    patch.gmail_sender_email !== undefined
      ? patch.gmail_sender_email?.trim() || null
      : existing?.gmail_sender_email ?? null;

  let appBase =
    patch.app_base_url !== undefined ? patch.app_base_url?.trim() || null : existing?.app_base_url ?? null;

  let encPass: string | null;
  if (patch.clear_encryption_passphrase) {
    encPass = null;
  } else if (patch.credentials_encryption_passphrase !== undefined) {
    encPass = patch.credentials_encryption_passphrase?.trim() || null;
  } else {
    encPass = existing?.credentials_encryption_passphrase ?? null;
  }

  if (patch.clear_gmail_refresh) {
    refreshEnc = null;
  }

  const secretPlain = patch.gmail_client_secret?.trim();
  if (secretPlain) {
    const phraseForCrypto =
      encPass?.trim() ||
      existing?.credentials_encryption_passphrase?.trim() ||
      process.env.EMAIL_SECRETS_KEY?.trim();
    if (!phraseForCrypto) {
      throw new Error(
        "Cannot encrypt the Client Secret without a key. Enter it under Server variables (Gmail encryption passphrase) and save, or include it in the same request as the secret; alternatively set EMAIL_SECRETS_KEY in the server environment."
      );
    }
    clientSecretEnc = encryptEmailSecret(secretPlain, phraseForCrypto);
  }

  let smtpHost = patch.smtp_host !== undefined ? patch.smtp_host?.trim() || null : existing?.smtp_host ?? null;
  let smtpPort = patch.smtp_port !== undefined ? patch.smtp_port : existing?.smtp_port ?? null;
  let smtpSecure =
    patch.smtp_secure !== undefined && patch.smtp_secure !== null
      ? Boolean(patch.smtp_secure)
      : existing?.smtp_secure ?? false;
  let smtpAuthUser =
    patch.smtp_auth_user !== undefined ? patch.smtp_auth_user?.trim() || null : existing?.smtp_auth_user ?? null;
  let smtpFromEmail =
    patch.smtp_from_email !== undefined ? patch.smtp_from_email?.trim() || null : existing?.smtp_from_email ?? null;
  let smtpFromName =
    patch.smtp_from_name !== undefined ? patch.smtp_from_name?.trim() || null : existing?.smtp_from_name ?? null;
  let smtpPassEnc = existing?.smtp_auth_pass_enc ?? null;

  if (patch.clear_smtp_auth_pass) {
    smtpPassEnc = null;
  }

  const smtpPassPlain = patch.smtp_auth_pass?.trim();
  if (smtpPassPlain) {
    const phraseForSmtp =
      encPass?.trim() ||
      existing?.credentials_encryption_passphrase?.trim() ||
      process.env.EMAIL_SECRETS_KEY?.trim();
    if (!phraseForSmtp) {
      throw new Error(
        "Cannot encrypt the SMTP password without a key. Set the encryption passphrase under Server variables or EMAIL_SECRETS_KEY on the server."
      );
    }
    smtpPassEnc = encryptEmailSecret(smtpPassPlain, phraseForSmtp);
  }

  const row = {
    id: true,
    provider: patch.provider,
    gmail_client_id: clientId,
    gmail_client_secret_enc: clientSecretEnc,
    gmail_refresh_token_enc: refreshEnc,
    gmail_sender_email: sender,
    app_base_url: appBase,
    credentials_encryption_passphrase: encPass,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_secure: smtpSecure,
    smtp_auth_user: smtpAuthUser,
    smtp_auth_pass_enc: smtpPassEnc,
    smtp_from_email: smtpFromEmail,
    smtp_from_name: smtpFromName,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const { error } = await admin.from("email_delivery_settings").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function saveGmailOAuthResult(
  admin: SupabaseClient,
  opts: { refreshToken: string; senderEmail: string },
  userId: string | null
): Promise<void> {
  const existing = await fetchEmailDeliverySettings(admin);
  const phrase = await loadEncryptionPassphrase(admin);
  const refreshEnc = encryptEmailSecret(opts.refreshToken, phrase);
  const { error } = await admin
    .from("email_delivery_settings")
    .upsert(
      {
        id: true,
        provider: "gmail_workspace_oauth",
        gmail_client_id: existing?.gmail_client_id ?? null,
        gmail_client_secret_enc: existing?.gmail_client_secret_enc ?? null,
        gmail_refresh_token_enc: refreshEnc,
        gmail_sender_email: opts.senderEmail.trim(),
        app_base_url: existing?.app_base_url ?? null,
        credentials_encryption_passphrase: existing?.credentials_encryption_passphrase ?? null,
        smtp_host: existing?.smtp_host ?? null,
        smtp_port: existing?.smtp_port ?? null,
        smtp_secure: existing?.smtp_secure ?? false,
        smtp_auth_user: existing?.smtp_auth_user ?? null,
        smtp_auth_pass_enc: existing?.smtp_auth_pass_enc ?? null,
        smtp_from_email: existing?.smtp_from_email ?? null,
        smtp_from_name: existing?.smtp_from_name ?? null,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "id" }
    );
  if (error) throw new Error(error.message);
}
