"use client";

import { createClient } from "@/utils/supabase/client";
import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";
import { useEffect } from "react";

/**
 * Clears invalid Supabase auth cookies (e.g. after DB reset, revoked sessions, or
 * switching projects) so the client stops spamming refresh_token_not_found.
 */
export function SupabaseStaleSessionCleanup() {
  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ error }) => {
      if (error && isStaleRefreshTokenError(error)) {
        void supabase.auth.signOut().catch(() => {
          /* ignore */
        });
      }
    });
  }, []);
  return null;
}
