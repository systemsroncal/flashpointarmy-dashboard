import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { hashOtp, normalizeEmail, OTP_PURPOSE_REGISTER } from "@/lib/auth/email-otp";

type RegisterPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  primaryChapterId?: string;
  otp?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;
    const email = normalizeEmail(body.email || "");
    const password = (body.password || "").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim() || null;
    const primaryChapterId = (body.primaryChapterId || "").trim();
    const otp = (body.otp || "").trim();

    if (!email || !password || !firstName || !lastName || !primaryChapterId || !otp) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: otpRow, error: otpErr } = await supabase
      .from("email_otp_codes")
      .select("id, otp_hash, attempts, max_attempts, expires_at")
      .eq("email", email)
      .eq("purpose", OTP_PURPOSE_REGISTER)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpErr || !otpRow) {
      return NextResponse.json({ error: "No active verification code found." }, { status: 400 });
    }
    if (otpRow.expires_at < nowIso) {
      return NextResponse.json({ error: "Verification code expired. Request a new one." }, { status: 400 });
    }
    if (otpRow.attempts >= otpRow.max_attempts) {
      return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    }

    const expectedHash = hashOtp(email, OTP_PURPOSE_REGISTER, otp);
    if (expectedHash !== otpRow.otp_hash) {
      await supabase
        .from("email_otp_codes")
        .update({ attempts: otpRow.attempts + 1 })
        .eq("id", otpRow.id);
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
    const already = existingUsers.users.find((u) => (u.email || "").toLowerCase() === email);
    if (already) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        primary_chapter_id: primaryChapterId,
        phone,
      },
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: createErr?.message || "Could not create account." }, { status: 500 });
    }

    await supabase
      .from("email_otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not complete registration." },
      { status: 500 }
    );
  }
}
