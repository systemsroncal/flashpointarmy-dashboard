/**
 * Default sign-in password for users created via Excel import, Fluent Forms sync, or the
 * Fluent Forms webhook when the row does not supply a valid password (min 8 characters).
 *
 * When this value is used as the effective password, set `require_password_change: true`
 * on auth `user_metadata` so `FirstLoginPasswordGate` prompts on first dashboard visit.
 */
export const DEFAULT_EXTERNAL_USER_PASSWORD = "FLASHPOINT";

export function isDefaultExternalPassword(effectivePassword: string): boolean {
  return effectivePassword === DEFAULT_EXTERNAL_USER_PASSWORD;
}

/** Merge into Supabase `auth.admin` create/update `user_metadata`. */
export function withExternalPasswordChangeFlag(
  base: Record<string, unknown>,
  effectivePassword: string
): Record<string, unknown> {
  return {
    ...base,
    require_password_change: isDefaultExternalPassword(effectivePassword),
  };
}
