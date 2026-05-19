import type { SupabaseClient } from "@supabase/supabase-js";
import { hashOtp, normalizeEmail } from "@/lib/auth/email-otp";

export type VerifyEmailOtpResult =
  | { ok: true; rowId: string }
  | { ok: false; error: string; status: number };

export async function verifyEmailOtp(
  supabase: SupabaseClient,
  email: string,
  purpose: string,
  otp: string
): Promise<VerifyEmailOtpResult> {
  const normalized = normalizeEmail(email);
  const code = otp.trim();
  if (!code) {
    return { ok: false, error: "Verification code is required.", status: 400 };
  }

  const nowIso = new Date().toISOString();
  const { data: otpRow, error: otpErr } = await supabase
    .from("email_otp_codes")
    .select("id, otp_hash, attempts, max_attempts, expires_at")
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpErr || !otpRow) {
    return { ok: false, error: "No active verification code found.", status: 400 };
  }
  if (otpRow.expires_at < nowIso) {
    return { ok: false, error: "Verification code expired. Request a new one.", status: 400 };
  }
  if (otpRow.attempts >= otpRow.max_attempts) {
    return { ok: false, error: "Too many attempts. Request a new code.", status: 429 };
  }

  const expectedHash = hashOtp(normalized, purpose, code);
  if (expectedHash !== otpRow.otp_hash) {
    await supabase
      .from("email_otp_codes")
      .update({ attempts: otpRow.attempts + 1 })
      .eq("id", otpRow.id);
    return { ok: false, error: "Invalid verification code.", status: 400 };
  }

  return { ok: true, rowId: otpRow.id };
}
