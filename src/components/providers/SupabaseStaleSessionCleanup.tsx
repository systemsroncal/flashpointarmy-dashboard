"use client";

import { SIGNING_OUT_SESSION_KEY } from "@/lib/auth/session-policy";
import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

/**
 * Clears invalid Supabase auth cookies (e.g. after DB reset, revoked sessions, or
 * switching projects). Uses `getSession()` because that is what triggers a refresh
 * and surfaces `refresh_token_not_found` / `AuthApiError` in the console if the token is gone.
 */
export function SupabaseStaleSessionCleanup() {
  useEffect(() => {
    let cancelled = false;
    let client: ReturnType<typeof createClient>;
    try {
      client = createClient();
    } catch (e) {
      console.error(
        "[SupabaseStaleSessionCleanup] Browser Supabase client unavailable (check NEXT_PUBLIC_* and rebuild).",
        e
      );
      return;
    }

    async function clearStale() {
      try {
        if (sessionStorage.getItem(SIGNING_OUT_SESSION_KEY)) {
          sessionStorage.removeItem(SIGNING_OUT_SESSION_KEY);
          return;
        }
      } catch {
        /* ignore */
      }
      const { error } = await client.auth.getSession();
      if (cancelled) return;
      if (!error || !isStaleRefreshTokenError(error)) return;
      try {
        await client.auth.signOut({ scope: "local" });
      } catch {
        /* ignore */
      }
      const path = window.location.pathname;
      if (path.startsWith("/dashboard")) {
        window.location.assign("/login?reason=session_expired");
      }
    }

    void clearStale();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
