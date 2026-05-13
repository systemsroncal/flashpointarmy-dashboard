/**
 * Gmail OAuth Client Secret from server environment only (never from the browser).
 * Kept separate from `email-delivery-settings` to avoid circular imports.
 */
export function getGmailOAuthClientSecretFromEnv(): string {
  return (
    process.env.GMAIL_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ||
    ""
  );
}

export function hasGmailOAuthClientSecretInEnv(): boolean {
  return Boolean(getGmailOAuthClientSecretFromEnv());
}
