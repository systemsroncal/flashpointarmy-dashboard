import { NextResponse } from "next/server";
import { createRawToken, hashActionToken } from "@/lib/auth/email-action-token";
import { resolveAuthUserByEmail } from "@/lib/auth/resolve-auth-user-by-email";
import { getAppBaseUrl } from "@/lib/mail/app-base-url";
import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const user = await resolveAuthUserByEmail(supabase, normalized);

    // Always return ok to avoid leaking account existence.
    if (!user?.id || !user.email) return NextResponse.json({ ok: true });

    const rawToken = createRawToken();
    const tokenHash = hashActionToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await supabase.from("email_action_tokens").insert({
      action: "password_reset",
      email: normalized,
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      payload: {},
    });

    const siteBase = await getAppBaseUrl(supabase);
    const resetUrl = `${siteBase}/auth/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(normalized)}`;
    await sendTemplatedEmail("password_reset", normalized, {
      user_fullname:
        user.user_metadata?.first_name && user.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : normalized,
      user_email: normalized,
      resetpassword_url: resetUrl,
      validateemail_url: "",
      app_name: "Flashpoint Dashboard",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not request reset." }, { status: 500 });
  }
}
