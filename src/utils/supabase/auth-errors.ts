/** Supabase Auth errors where stored refresh token must be discarded. */
export function isStaleRefreshTokenError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "refresh_token_not_found") return true;
  if (err.code === "invalid_refresh_token") return true;
  const m = err.message?.toLowerCase() ?? "";
  return m.includes("refresh token not found") || m.includes("invalid refresh token");
}
