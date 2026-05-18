import { NextResponse } from "next/server";
import { loadUserRoleNames } from "@/lib/auth/user-roles";
import { fetchEmailDeliverySettings, upsertEmailDeliverySettings } from "@/lib/mail/email-delivery-settings";
import { getGmailOAuthRedirectUri } from "@/lib/mail/app-base-url";
import { hasGmailOAuthClientSecretInEnv } from "@/lib/mail/gmail-oauth-client-secret-env";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireApiAuth } from "@/lib/auth/server-session";

async function requireSuperAdmin() {
  const authResult = await requireApiAuth();
  if ("response" in authResult) {
    return { error: authResult.response };
  }
  const { supabase, user } = authResult;
  const roles = await loadUserRoleNames(supabase, user.id);
  if (!roles.includes("super_admin")) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { userId: user.id };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();
  const row = await fetchEmailDeliverySettings(admin);
  return NextResponse.json({
    provider: row?.provider ?? "env_smtp",
    gmail_client_id: row?.gmail_client_id ?? "",
    gmail_client_secret_from_env: hasGmailOAuthClientSecretInEnv(),
    has_client_secret:
      hasGmailOAuthClientSecretInEnv() || Boolean(row?.gmail_client_secret_enc?.trim()),
    has_stored_db_client_secret: Boolean(row?.gmail_client_secret_enc?.trim()),
    has_refresh_token: Boolean(row?.gmail_refresh_token_enc?.trim()),
    gmail_sender_email: row?.gmail_sender_email ?? "",
    app_base_url: row?.app_base_url ?? "",
    has_encryption_passphrase: Boolean(
      row?.credentials_encryption_passphrase?.trim() || process.env.EMAIL_SECRETS_KEY?.trim()
    ),
    oauth_redirect_uri: await getGmailOAuthRedirectUri(admin),
    smtp_host: row?.smtp_host ?? "",
    smtp_port: row?.smtp_port ?? null,
    smtp_secure: row?.smtp_secure === true,
    smtp_auth_user: row?.smtp_auth_user ?? "",
    smtp_from_email: row?.smtp_from_email ?? "",
    smtp_from_name: row?.smtp_from_name ?? "",
    has_smtp_password: Boolean(row?.smtp_auth_pass_enc?.trim()),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    provider?: string;
    gmail_client_id?: string;
    gmail_client_secret?: string;
    gmail_sender_email?: string;
    clear_gmail_refresh?: boolean;
    clear_gmail_client_secret?: boolean;
    app_base_url?: string;
    credentials_encryption_passphrase?: string;
    clear_encryption_passphrase?: boolean;
    smtp_host?: string | null;
    smtp_port?: number | null;
    smtp_secure?: boolean;
    smtp_auth_user?: string | null;
    smtp_auth_pass?: string | null;
    smtp_from_email?: string | null;
    smtp_from_name?: string | null;
    clear_smtp_auth_pass?: boolean;
  };

  const admin = createAdminClient();
  const existingRow = await fetchEmailDeliverySettings(admin);
  const nextProvider =
    body.provider === "gmail_workspace_oauth"
      ? "gmail_workspace_oauth"
      : body.provider === "dashboard_smtp"
        ? "dashboard_smtp"
        : body.provider === "env_smtp"
          ? "env_smtp"
          : ((existingRow?.provider as "env_smtp" | "gmail_workspace_oauth" | "dashboard_smtp") ?? "env_smtp");

  try {
    await upsertEmailDeliverySettings(
      admin,
      {
        provider: nextProvider,
        gmail_client_id: body.gmail_client_id,
        gmail_client_secret: body.gmail_client_secret,
        gmail_sender_email: body.gmail_sender_email,
        clear_gmail_refresh: body.clear_gmail_refresh === true,
        clear_gmail_client_secret: body.clear_gmail_client_secret === true,
        app_base_url: body.app_base_url,
        credentials_encryption_passphrase: body.credentials_encryption_passphrase,
        clear_encryption_passphrase: body.clear_encryption_passphrase === true,
        smtp_host: body.smtp_host,
        smtp_port: body.smtp_port,
        smtp_secure: body.smtp_secure,
        smtp_auth_user: body.smtp_auth_user,
        smtp_auth_pass: body.smtp_auth_pass,
        smtp_from_email: body.smtp_from_email,
        smtp_from_name: body.smtp_from_name,
        clear_smtp_auth_pass: body.clear_smtp_auth_pass === true,
      },
      auth.userId
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const row = await fetchEmailDeliverySettings(admin);
  return NextResponse.json({
    ok: true,
    provider: row?.provider ?? "env_smtp",
    gmail_client_id: row?.gmail_client_id ?? "",
    gmail_client_secret_from_env: hasGmailOAuthClientSecretInEnv(),
    has_client_secret:
      hasGmailOAuthClientSecretInEnv() || Boolean(row?.gmail_client_secret_enc?.trim()),
    has_stored_db_client_secret: Boolean(row?.gmail_client_secret_enc?.trim()),
    has_refresh_token: Boolean(row?.gmail_refresh_token_enc?.trim()),
    gmail_sender_email: row?.gmail_sender_email ?? "",
    app_base_url: row?.app_base_url ?? "",
    has_encryption_passphrase: Boolean(
      row?.credentials_encryption_passphrase?.trim() || process.env.EMAIL_SECRETS_KEY?.trim()
    ),
    oauth_redirect_uri: await getGmailOAuthRedirectUri(admin),
    smtp_host: row?.smtp_host ?? "",
    smtp_port: row?.smtp_port ?? null,
    smtp_secure: row?.smtp_secure === true,
    smtp_auth_user: row?.smtp_auth_user ?? "",
    smtp_from_email: row?.smtp_from_email ?? "",
    smtp_from_name: row?.smtp_from_name ?? "",
    has_smtp_password: Boolean(row?.smtp_auth_pass_enc?.trim()),
  });
}
