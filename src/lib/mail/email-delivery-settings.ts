import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptEmailSecret, encryptEmailSecret } from "@/lib/mail/email-secrets-crypto";

export type EmailDeliveryProvider = "env_smtp" | "gmail_workspace_oauth";

export type EmailDeliveryRow = {
  id: boolean;
  provider: EmailDeliveryProvider;
  gmail_client_id: string | null;
  gmail_client_secret_enc: string | null;
  gmail_refresh_token_enc: string | null;
  gmail_sender_email: string | null;
  app_base_url: string | null;
  credentials_encryption_passphrase: string | null;
  updated_at: string;
};

export async function fetchEmailDeliverySettings(admin: SupabaseClient): Promise<EmailDeliveryRow | null> {
  const { data, error } = await admin.from("email_delivery_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return null;
  return data as EmailDeliveryRow;
}

/** Frase de cifrado: primero BD (módulo visual), luego `EMAIL_SECRETS_KEY` en el servidor. */
export async function loadEncryptionPassphrase(admin: SupabaseClient): Promise<string> {
  const row = await fetchEmailDeliverySettings(admin);
  const fromDb = row?.credentials_encryption_passphrase?.trim();
  const fromEnv = process.env.EMAIL_SECRETS_KEY?.trim();
  const v = fromDb || fromEnv;
  if (!v) {
    throw new Error(
      "Falta la clave de cifrado: configúrala en Emails → Sending (sección «Variables del servidor») o define EMAIL_SECRETS_KEY en el entorno del servidor."
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
        "Para guardar el Client Secret hace falta una clave de cifrado: complétala en «Variables del servidor» o define EMAIL_SECRETS_KEY en el servidor."
      );
    }
    clientSecretEnc = encryptEmailSecret(secretPlain, phraseForCrypto);
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
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "id" }
    );
  if (error) throw new Error(error.message);
}
