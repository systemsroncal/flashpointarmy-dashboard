import { NextResponse } from "next/server";
import { createGmailOAuthState } from "@/lib/mail/email-oauth-state";
import { decryptDeliverySecrets, fetchEmailDeliverySettings, loadEncryptionPassphrase } from "@/lib/mail/email-delivery-settings";
import { getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const roles = await loadUserRoleNames(supabase, user.id);
  if (!roles.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = createAdminClient();
  const row = await fetchEmailDeliverySettings(admin);
  if (!row?.gmail_client_id?.trim()) {
    return NextResponse.json({ error: "Save Google Client ID and Client Secret in Emails → Sending first." }, { status: 400 });
  }
  const phrase = await loadEncryptionPassphrase(admin);
  const { clientSecret } = decryptDeliverySecrets(row, phrase);
  if (!clientSecret?.trim()) {
    return NextResponse.json({ error: "Save the Google Client Secret in Emails → Sending first." }, { status: 400 });
  }

  let state: string;
  try {
    state = createGmailOAuthState(user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OAuth state error.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const redirectUri = await getGmailOAuthRedirectUri(admin);
  const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.send");
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(row.gmail_client_id.trim())}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code&scope=${scope}` +
    `&access_type=offline&prompt=consent` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(url);
}
