import { NextResponse } from "next/server";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  normalizeEmail,
  OTP_PURPOSE_REGISTER,
} from "@/lib/auth/email-otp";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import { createAdminClient } from "@/utils/supabase/admin";

const MIN_SECONDS_BETWEEN_SENDS = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = normalizeEmail(body.email || "");
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - MIN_SECONDS_BETWEEN_SENDS * 1000).toISOString();
    const { data: recentRow } = await supabase
      .from("email_otp_codes")
      .select("id")
      .eq("email", email)
      .eq("purpose", OTP_PURPOSE_REGISTER)
      .is("consumed_at", null)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentRow) {
      return NextResponse.json(
        { error: "Please wait about 60 seconds before requesting another code." },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const otpHash = hashOtp(email, OTP_PURPOSE_REGISTER, otp);
    const expiresAt = getOtpExpiryDate().toISOString();

    const { error: insertErr } = await supabase.from("email_otp_codes").insert({
      email,
      otp_hash: otpHash,
      purpose: OTP_PURPOSE_REGISTER,
      expires_at: expiresAt,
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await sendOtpEmail({ email, otp });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send OTP." },
      { status: 500 }
    );
  }
}
