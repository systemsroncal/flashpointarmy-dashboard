import { NextResponse } from "next/server";
import { isEmailInUse } from "@/lib/auth/email-in-use";
import {
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  normalizeEmail,
  OTP_PURPOSE_CHANGE_EMAIL,
} from "@/lib/auth/email-otp";
import { requireApiAuth } from "@/lib/auth/server-session";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import { createAdminClient } from "@/utils/supabase/admin";

const MIN_SECONDS_BETWEEN_SENDS = 60;

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if ("response" in authResult) return authResult.response;
    const { user } = authResult;

    const currentEmail = normalizeEmail(user.email || "");
    if (!currentEmail) {
      return NextResponse.json({ error: "Your account has no email on file." }, { status: 400 });
    }

    const body = (await req.json()) as { newEmail?: string };
    const newEmail = normalizeEmail(body.newEmail || "");
    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json({ error: "A valid new email is required." }, { status: 400 });
    }
    if (newEmail === currentEmail) {
      return NextResponse.json({ error: "New email must be different from your current email." }, { status: 400 });
    }

    const admin = createAdminClient();
    if (await isEmailInUse(admin, newEmail, user.id)) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }

    const cutoff = new Date(Date.now() - MIN_SECONDS_BETWEEN_SENDS * 1000).toISOString();
    const { data: recentRow } = await admin
      .from("email_otp_codes")
      .select("id")
      .eq("email", currentEmail)
      .eq("purpose", OTP_PURPOSE_CHANGE_EMAIL)
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
    const otpHash = hashOtp(currentEmail, OTP_PURPOSE_CHANGE_EMAIL, otp);
    const expiresAt = getOtpExpiryDate().toISOString();

    const { error: insertErr } = await admin.from("email_otp_codes").insert({
      email: currentEmail,
      otp_hash: otpHash,
      purpose: OTP_PURPOSE_CHANGE_EMAIL,
      expires_at: expiresAt,
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fullname =
      [meta?.first_name, meta?.last_name].filter((v) => typeof v === "string" && v.trim()).join(" ").trim() ||
      user.email?.split("@")[0] ||
      "there";

    await sendOtpEmail({ email: currentEmail, otp, userFullname: fullname });
    return NextResponse.json({
      ok: true,
      sentTo: currentEmail,
      message: `Verification code sent to ${currentEmail}.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send verification code." },
      { status: 500 }
    );
  }
}
