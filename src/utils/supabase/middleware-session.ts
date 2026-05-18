import {
  clearSessionStartedCookie,
  isAppSessionExpired,
  readSessionStartedAt,
  setSessionStartedCookie,
} from "@/lib/auth/session-policy";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Enforces 24h max session. Returns a redirect when expired; otherwise updates
 * `supabaseResponse` with a session-start cookie when missing.
 */
export function applyAppSessionPolicy(
  request: NextRequest,
  user: User | null,
  supabaseResponse: NextResponse
): NextResponse | null {
  if (!user) return supabaseResponse;

  const startedAt = readSessionStartedAt(request);
  if (isAppSessionExpired(startedAt)) {
    return null;
  }

  if (startedAt === null) {
    setSessionStartedCookie(supabaseResponse);
  }

  return supabaseResponse;
}

/** Sign out Supabase + clear app session cookie, then redirect to login. */
export async function redirectExpiredAppSession(
  request: NextRequest
): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("reason", "session_expired");
  let response = NextResponse.redirect(url);

  const supabase = createServerClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
  clearSessionStartedCookie(response);
  return response;
}
