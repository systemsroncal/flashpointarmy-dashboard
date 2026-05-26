import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";

function asAuthErrorLike(err: unknown): { message?: string; code?: string; name?: string } | null {
  if (!err || typeof err !== "object") return null;
  const o = err as { message?: string; code?: string; name?: string };
  return o;
}

/** Clear invalid refresh cookies and return null instead of throwing (SSR-safe). */
export async function clearStaleAuthSession(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}

/**
 * Safe `auth.getUser()` for Server Components / routes.
 * Stale or revoked refresh tokens must not surface as Next.js "Application error".
 */
export async function getAuthUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; staleSessionCleared: boolean }> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isStaleRefreshTokenError(error)) {
        await clearStaleAuthSession(supabase);
        return { user: null, staleSessionCleared: true };
      }
      return { user: null, staleSessionCleared: false };
    }
    return { user: data.user ?? null, staleSessionCleared: false };
  } catch (err) {
    if (isStaleRefreshTokenError(asAuthErrorLike(err))) {
      await clearStaleAuthSession(supabase);
      return { user: null, staleSessionCleared: true };
    }
    /* Network / config glitches must not surface as the generic "Under Maintenance" error page. */
    return { user: null, staleSessionCleared: false };
  }
}
