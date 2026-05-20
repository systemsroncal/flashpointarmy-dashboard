import { DEFAULT_EXTERNAL_USER_PASSWORD } from "@/lib/auth/default-external-user-password";

/**
 * Password variants to try on sign-in (server-only). Organization default password
 * accepts any letter case so users are not blocked by Caps Lock.
 */
export function signInPasswordCandidates(rawPassword: string): string[] {
  const trimmed = rawPassword.trim();
  const candidates: string[] = [];
  if (trimmed.length > 0) candidates.push(trimmed);
  if (rawPassword.length > 0 && rawPassword !== trimmed) candidates.push(rawPassword);
  if (trimmed.toUpperCase() === DEFAULT_EXTERNAL_USER_PASSWORD.toUpperCase()) {
    candidates.push(DEFAULT_EXTERNAL_USER_PASSWORD);
  }
  return [...new Set(candidates)];
}
