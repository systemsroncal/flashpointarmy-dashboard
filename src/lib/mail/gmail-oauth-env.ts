import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailDeliveryRow } from "@/lib/mail/email-delivery-settings";
import { loadEncryptionPassphrase } from "@/lib/mail/email-delivery-settings";
import { getGmailOAuthClientSecretFromEnv } from "@/lib/mail/gmail-oauth-client-secret-env";
import { decryptEmailSecret } from "@/lib/mail/email-secrets-crypto";

/** Env secret first; otherwise decrypt DB blob (legacy). */
export async function resolveGmailOAuthClientSecret(
  admin: SupabaseClient,
  row: EmailDeliveryRow
): Promise<string | null> {
  const env = getGmailOAuthClientSecretFromEnv();
  if (env) return env;
  if (!row.gmail_client_secret_enc?.trim()) return null;
  try {
    const phrase = await loadEncryptionPassphrase(admin);
    return decryptEmailSecret(row.gmail_client_secret_enc, phrase).trim() || null;
  } catch {
    return null;
  }
}
