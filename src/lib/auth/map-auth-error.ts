type MaybeAuthError = {
  message?: string;
  status?: number;
  code?: string;
};

/**
 * Normalizes Supabase Auth errors into user-friendly messages.
 */
export function mapSignUpErrorMessage(err: MaybeAuthError | null | undefined): string {
  if (!err) return "Could not create the account. Please try again.";
  const raw = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();
  const status = err.status ?? 0;

  if (
    status === 429 ||
    raw.includes("email rate limit exceeded") ||
    code.includes("rate_limit") ||
    code.includes("over_email_send_rate_limit")
  ) {
    return "Email send rate limit reached. Wait about 60 seconds, then try again.";
  }

  if (raw.includes("user already registered")) {
    return "This email is already registered.";
  }

  return err.message || "Could not create the account. Please try again.";
}
