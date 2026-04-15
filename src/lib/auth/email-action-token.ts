import crypto from "node:crypto";

export function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashActionToken(rawToken: string) {
  const secret = process.env.EMAIL_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-secret";
  return crypto.createHash("sha256").update(`${rawToken}|${secret}`).digest("hex");
}
