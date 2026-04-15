import crypto from "node:crypto";

export const OTP_PURPOSE_REGISTER = "register";
export const OTP_TTL_MINUTES = 10;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(email: string, purpose: string, otp: string) {
  const secret = process.env.EMAIL_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-secret";
  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}|${purpose}|${otp}|${secret}`)
    .digest("hex");
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}
