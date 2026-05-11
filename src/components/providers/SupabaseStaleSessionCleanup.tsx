"use client";

import { createClient } from "@/utils/supabase/client";
import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";
import { useEffect } from "react";

/**
 * Clears invalid Supabase auth cookies (e.g. after DB reset, revoked sessions, or
 * switching projects). Uses `getSession()` because that is what triggers a refresh
 * and surfaces `refresh_token_not_found` / `AuthApiError` in the console if the token is gone.
 */
export function SupabaseStaleSessionCleanup() {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function clearStale() {
      const { error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!error || !isStaleRefreshTokenError(error)) return;
      try {
        await supabase.auth.signOut({ scope: "local" });
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
