import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { verifyGmailOAuthState } from "@/lib/mail/email-oauth-state";
import { decryptDeliverySecrets, fetchEmailDeliverySettings, loadEncryptionPassphrase, saveGmailOAuthResult } from "@/lib/mail/email-delivery-settings";
import { getAppBaseUrl, getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  const admin = createAdminClient();
  const base = await getAppBaseUrl(admin);
  const fail = (code: string) =>
    NextResponse.redirect(`${base}/dashboard/emails?tab=sending&gmail_error=${encodeURIComponent(code)}`);

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return fail(err);
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return fail("missing_code");
  }

  const parsed = verifyGmailOAuthState(state);
  if (!parsed) {
    return fail("bad_state");
  }

  const row = await fetchEmailDeliverySettings(admin);
  if (!row?.gmail_client_id?.trim()) {
    return fail("no_client");
  }
  const phrase = await loadEncryptionPassphrase(admin);
  const { clientSecret } = decryptDeliverySecrets(row, phrase);
  if (!clientSecret?.trim()) {
    return fail("no_secret");
  }

  const redirectUri = await getGmailOAuthRedirectUri(admin);
  const oauth2 = new OAuth2Client(row.gmail_client_id.trim(), clientSecret, redirectUri);
  let tokens;
  try {
    const res = await oauth2.getToken(code);
    tokens = res.tokens;
  } catch {
    return fail("token_exchange");
  }

  const refresh = tokens.refresh_token;
  const access = tokens.access_token;
  if (!refresh) {
    return fail("no_refresh_token");
  }

  let senderEmail = row.gmail_sender_email?.trim() ?? "";
  if (access) {
    try {
      const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (r.ok) {
        const info = (await r.json()) as { email?: string };
        if (info.email?.trim()) {
          senderEmail = info.email.trim();
        }
      }
    } catch {
      /* keep row sender or empty */
    }
  }
  if (!senderEmail) {
    return fail("no_sender_email");
  }

  try {
    await saveGmailOAuthResult(admin, { refreshToken: refresh, senderEmail: senderEmail }, parsed.userId);
  } catch {
    return fail("save_failed");
  }

  return NextResponse.redirect(`${base}/dashboard/emails?tab=sending&gmail_connected=1`);
}
