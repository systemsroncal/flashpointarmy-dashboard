import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function asAuthErrorLike(err: unknown): { message?: string; code?: string; name?: string } | null {
  if (!err || typeof err !== "object") return null;
  return err as { message?: string; code?: string; name?: string };
}

/** Browser-safe auth read; clears local session when refresh token is invalid. */
export async function getClientAuthUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; staleSessionCleared: boolean }> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isStaleRefreshTokenError(error)) {
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          /* ignore */
        }
        return { user: null, staleSessionCleared: true };
      }
      return { user: null, staleSessionCleared: false };
    }
    return { user: data.user ?? null, staleSessionCleared: false };
  } catch (err) {
    if (isStaleRefreshTokenError(asAuthErrorLike(err))) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* ignore */
      }
      return { user: null, staleSessionCleared: true };
    }
    throw err;
  }
}
