import { normalizeAuthEmail } from "@/lib/auth/normalize-auth-email";
import {
  isInvalidLoginCredentialsError,
  signInPasswordCandidates,
} from "@/lib/auth/sign-in-password";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export type SignInWithPasswordResult =
  | { ok: true }
  | { ok: false; error: AuthError; triedDefaultPasswordVariant: boolean };

/**
 * Sign in with normalized email; retries FLASHPOINT with canonical casing when applicable.
 */
export async function signInWithPasswordFlexible(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<SignInWithPasswordResult> {
  const normalizedEmail = normalizeAuthEmail(email);
  const candidates = signInPasswordCandidates(password);
  let lastError: AuthError | null = null;
  let triedDefaultPasswordVariant = false;

  for (let i = 0; i < candidates.length; i++) {
    const pwd = candidates[i]!;
    if (i > 0) triedDefaultPasswordVariant = true;
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pwd,
    });
    if (!error) return { ok: true };
    lastError = error;
    if (!isInvalidLoginCredentialsError(error) || i === candidates.length - 1) {
      break;
    }
  }

  return {
    ok: false,
    error: lastError!,
    triedDefaultPasswordVariant,
  };
}
