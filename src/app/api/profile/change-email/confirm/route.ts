import { NextResponse } from "next/server";
import { isEmailInUse } from "@/lib/auth/email-in-use";
import { normalizeEmail, OTP_PURPOSE_CHANGE_EMAIL } from "@/lib/auth/email-otp";
import { requireApiAuth } from "@/lib/auth/server-session";
import { verifyEmailOtp } from "@/lib/auth/verify-email-otp";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { user } = authResult;

    const currentEmail = normalizeEmail(user.email || "");
    if (!currentEmail) {
      return NextResponse.json({ error: "Your account has no email on file." }, { status: 400 });
    }

    const body = (await req.json()) as { newEmail?: string; otp?: string };
    const newEmail = normalizeEmail(body.newEmail || "");
    const otp = (body.otp || "").trim();

    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json({ error: "A valid new email is required." }, { status: 400 });
    }
    if (!otp) {
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    }
    if (newEmail === currentEmail) {
      return NextResponse.json({ error: "New email must be different from your current email." }, { status: 400 });
    }

    const admin = createAdminClient();
    if (await isEmailInUse(admin, newEmail, user.id)) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }

    const verified = await verifyEmailOtp(admin, currentEmail, OTP_PURPOSE_CHANGE_EMAIL, otp);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    const { error: duErr } = await admin
      .from("dashboard_users")
      .update({ email: newEmail, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (duErr) {
      return NextResponse.json({ error: duErr.message }, { status: 500 });
    }

    await admin
      .from("email_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", verified.rowId);

    return NextResponse.json({ ok: true, email: newEmail });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to change email." },
      { status: 500 }
    );
  }
}
