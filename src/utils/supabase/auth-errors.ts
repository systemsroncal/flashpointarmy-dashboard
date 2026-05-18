import type { AuthError } from "@supabase/supabase-js";

/** Human-readable sign-in error; Supabase often returns empty `message` on network failures. */
export function formatAuthSignInError(err: AuthError): string {
  const msg = (err.message || "").trim();
  if (msg) {
    if (/failed to fetch|network|load failed|fetch failed/i.test(msg)) {
      return `${msg}. Check NEXT_PUBLIC_SUPABASE_URL and the anon key, that the project is active, and that extensions or the network are not blocking *.supabase.co.`;
    }
    return msg;
  }
  const name = String((err as { name?: string }).name || "");
  if (/AuthRetryableFetchError|retryable/i.test(name)) {
    return "Could not reach Supabase Auth (network, timeout, or server). Check the URL and key in .env, VPN/firewall, and project status on dashboard.supabase.com.";
  }
  const code = String((err as { code?: string }).code || "");
  if (code) return `Authentication error (${code}). Please try again.`;
  return "Authentication error with no message. Open the browser console (F12) and check the Network tab for /auth/v1/token.";
}

/** Supabase Auth errors where stored refresh token must be discarded. */
export function isStaleRefreshTokenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { message?: string; code?: string; name?: string };
  if (e.code === "refresh_token_not_found") return true;
  if (e.code === "invalid_refresh_token") return true;
  const m = e.message?.toLowerCase() ?? "";
  if (m.includes("refresh token not found")) return true;
  if (m.includes("invalid refresh token")) return true;
  if (m.includes("refresh token") && m.includes("not found")) return true;
  const n = String(e.name || "");
  if (n === "AuthApiError" || n === "AuthSessionMissingError") {
    if (m.includes("refresh") && (m.includes("invalid") || m.includes("not found"))) return true;
  }
  return false;
}
