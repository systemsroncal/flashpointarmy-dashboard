import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEmailDeliverySettings } from "@/lib/mail/email-delivery-settings";

/** URL pública del dashboard (OAuth redirect). BD primero, luego env, luego Vercel/local. */
export async function getAppBaseUrl(admin?: SupabaseClient): Promise<string> {
  if (admin) {
    const row = await fetchEmailDeliverySettings(admin);
    const fromDb = row?.app_base_url?.trim();
    if (fromDb) return fromDb.replace(/\/$/, "");
  }
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export async function getGmailOAuthRedirectUri(admin?: SupabaseClient): Promise<string> {
  return `${await getAppBaseUrl(admin)}/api/email/google/oauth/callback`;
}
