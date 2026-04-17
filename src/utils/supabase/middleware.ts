import { createServerClient } from "@supabase/ssr";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";
import { isStaleRefreshTokenError } from "@/utils/supabase/auth-errors";
import { NextResponse, type NextRequest } from "next/server";

export async function getSupabaseSession(request: NextRequest) {
  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseKey = getPublicSupabaseAnonKey();
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError && isStaleRefreshTokenError(userError)) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    return { supabase, user: null, supabaseResponse };
  }

  return { supabase, user: userData.user ?? null, supabaseResponse };
}
