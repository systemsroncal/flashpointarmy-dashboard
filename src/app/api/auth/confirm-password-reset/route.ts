import { NextResponse } from "next/server";
import { hashActionToken } from "@/lib/auth/email-action-token";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const { token, email, password } = (await req.json()) as {
      token?: string;
      email?: string;
      password?: string;
    };
    const rawToken = (token || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const nextPassword = password || "";
    const MIN_PASSWORD_LENGTH = 8;
    if (!rawToken || !normalizedEmail || nextPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const tokenHash = hashActionToken(rawToken);
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: row } = await supabase
      .from("email_action_tokens")
      .select("id, user_id, expires_at, consumed_at")
      .eq("action", "password_reset")
      .eq("email", normalizedEmail)
      .eq("token_hash", tokenHash)
      .is("consumed_at", null)
      .maybeSingle();

    if (!row || !row.user_id || row.expires_at < nowIso) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    const { data: existingUser } = await supabase.auth.admin.getUserById(row.user_id);
    const priorMeta =
      existingUser?.user && typeof existingUser.user.user_metadata === "object"
        ? (existingUser.user.user_metadata as Record<string, unknown>)
        : {};

    const { error: updateErr } = await supabase.auth.admin.updateUserById(row.user_id, {
      password: nextPassword,
      user_metadata: { ...priorMeta, require_password_change: false },
    });
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await supabase
      .from("email_action_tokens")
      .update({ consumed_at: nowIso })
      .eq("id", row.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not reset password." },
      { status: 500 }
    );
  }
}
