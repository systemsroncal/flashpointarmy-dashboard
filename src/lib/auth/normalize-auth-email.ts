/** Normalize email for sign-in and password-reset (trim + lowercase). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
