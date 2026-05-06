import type { AuthError } from "@supabase/supabase-js";

/** Human-readable sign-in error; Supabase often returns empty `message` on network failures. */
export function formatAuthSignInError(err: AuthError): string {
  const msg = (err.message || "").trim();
  if (msg) {
    if (/failed to fetch|network|load failed|fetch failed/i.test(msg)) {
      return `${msg}. Comprueba NEXT_PUBLIC_SUPABASE_URL y la clave anon, que el proyecto esté activo y que extensiones o la red no bloqueen *.supabase.co.`;
    }
    return msg;
  }
  const name = String((err as { name?: string }).name || "");
  if (/AuthRetryableFetchError|retryable/i.test(name)) {
    return "No se pudo contactar con Supabase Auth (red, timeout o servidor). Revisa URL y clave en .env, VPN/firewall y el estado del proyecto en dashboard.supabase.com.";
  }
  const code = String((err as { code?: string }).code || "");
  if (code) return `Error de autenticación (${code}). Vuelve a intentarlo.`;
  return "Error de autenticación sin mensaje. Abre la consola del navegador (F12) y revisa la pestaña Red para /auth/v1/token.";
}

/** Supabase Auth errors where stored refresh token must be discarded. */
export function isStaleRefreshTokenError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "refresh_token_not_found") return true;
  if (err.code === "invalid_refresh_token") return true;
  const m = err.message?.toLowerCase() ?? "";
  return m.includes("refresh token not found") || m.includes("invalid refresh token");
}
