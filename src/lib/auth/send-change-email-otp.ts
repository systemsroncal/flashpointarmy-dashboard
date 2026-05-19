import { OTP_PURPOSE_CHANGE_EMAIL, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/email-otp-constants";
import { generateOtpCode, getOtpExpiryDate, hashOtp, normalizeEmail } from "@/lib/auth/email-otp";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SendChangeEmailOtpResult =
  | { ok: true; sentTo: string; message: string }
  | { ok: false; error: string; status: number };

export async function sendChangeEmailOtp(
  admin: SupabaseClient,
  opts: {
    currentEmail: string;
    newEmail: string;
    excludeUserId: string;
    userFullname?: string;
  }
): Promise<SendChangeEmailOtpResult> {
  const currentEmail = normalizeEmail(opts.currentEmail);
  const newEmail = normalizeEmail(opts.newEmail);

  if (!currentEmail) {
    return { ok: false, error: "This account has no email on file.", status: 400 };
  }
  if (!newEmail || !newEmail.includes("@")) {
    return { ok: false, error: "A valid new email is required.", status: 400 };
  }
  if (newEmail === currentEmail) {
    return { ok: false, error: "New email must be different from the current email.", status: 400 };
  }

  const { isEmailInUse } = await import("@/lib/auth/email-in-use");
  if (await isEmailInUse(admin, newEmail, opts.excludeUserId)) {
    return { ok: false, error: "This email is already in use.", status: 409 };
  }

  const cutoff = new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000).toISOString();
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
    const minutes = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS / 60);
    return {
      ok: false,
      error: `Please wait about ${minutes} minutes before requesting another code.`,
      status: 429,
    };
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
    return { ok: false, error: insertErr.message, status: 500 };
  }

  await sendOtpEmail({
    email: currentEmail,
    otp,
    userFullname: opts.userFullname,
  });

  return {
    ok: true,
    sentTo: currentEmail,
    message: `Verification code sent to ${currentEmail}.`,
  };
}
