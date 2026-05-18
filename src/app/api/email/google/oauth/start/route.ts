import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/server-session";
import { createGmailOAuthState } from "@/lib/mail/email-oauth-state";
import { fetchEmailDeliverySettings } from "@/lib/mail/email-delivery-settings";
import { resolveGmailOAuthClientSecret } from "@/lib/mail/gmail-oauth-env";
import { getAppBaseUrl, getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) return authResult.response;
  const { supabase, user } = authResult;
  const roles = await loadUserRoleNames(supabase, user.id);
  if (!roles.includes("super_admin")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const admin = createAdminClient();
  const base = await getAppBaseUrl(admin);
  const fail = (code: string) =>
    NextResponse.redirect(`${base}/dashboard/emails?tab=sending&gmail_error=${encodeURIComponent(code)}`);

  try {
    const row = await fetchEmailDeliverySettings(admin);
    if (!row?.gmail_client_id?.trim()) {
      return fail("no_client_id");
    }

    const clientSecret = await resolveGmailOAuthClientSecret(admin, row);
    if (!clientSecret?.trim()) {
      return fail("no_client_secret");
    }

    let state: string;
    try {
      state = createGmailOAuthState(user.id);
    } catch {
      return fail("oauth_state_secret");
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
  } catch (e) {
    console.error("[gmail oauth start]", e);
    return fail("start_failed");
  }
}
