import { isEmailInUse } from "@/lib/auth/email-in-use";
import { normalizeEmail, OTP_PURPOSE_CHANGE_EMAIL } from "@/lib/auth/email-otp";
import { verifyEmailOtp } from "@/lib/auth/verify-email-otp";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ConfirmChangeEmailResult =
  | { ok: true; email: string }
  | { ok: false; error: string; status: number };

export async function confirmChangeEmailForUser(
  admin: SupabaseClient,
  userId: string,
  currentEmail: string,
  newEmail: string,
  otp: string
): Promise<ConfirmChangeEmailResult> {
  const normalizedCurrent = normalizeEmail(currentEmail);
  const normalizedNew = normalizeEmail(newEmail);
  const code = otp.trim();

  if (!normalizedCurrent) {
    return { ok: false, error: "This account has no email on file.", status: 400 };
  }
  if (!normalizedNew || !normalizedNew.includes("@")) {
    return { ok: false, error: "A valid new email is required.", status: 400 };
  }
  if (!code) {
    return { ok: false, error: "Verification code is required.", status: 400 };
  }
  if (normalizedNew === normalizedCurrent) {
    return { ok: false, error: "New email must be different from the current email.", status: 400 };
  }

  if (await isEmailInUse(admin, normalizedNew, userId)) {
    return { ok: false, error: "This email is already in use.", status: 409 };
  }

  const verified = await verifyEmailOtp(admin, normalizedCurrent, OTP_PURPOSE_CHANGE_EMAIL, code);
  if (!verified.ok) {
    return { ok: false, error: verified.error, status: verified.status };
  }

  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    email: normalizedNew,
    email_confirm: true,
  });
  if (authErr) {
    return { ok: false, error: authErr.message, status: 500 };
  }

  const { error: duErr } = await admin
    .from("dashboard_users")
    .update({ email: normalizedNew, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (duErr) {
    return { ok: false, error: duErr.message, status: 500 };
  }

  await admin
    .from("email_otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", verified.rowId);

  return { ok: true, email: normalizedNew };
}
