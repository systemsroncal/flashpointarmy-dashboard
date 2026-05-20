/** Client-safe helpers for Supabase sign-in errors (no password constants). */

export function isInvalidLoginCredentialsError(err: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toLowerCase();
  return code === "invalid_credentials" || msg.includes("invalid login credentials");
}
