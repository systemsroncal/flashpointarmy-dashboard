import { createServerClient } from "@supabase/ssr";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";
import { clearSessionStartedCookie } from "@/lib/auth/session-policy";
import { getAuthUser } from "@/utils/supabase/get-auth-user";
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

  const { user, staleSessionCleared } = await getAuthUser(supabase);
  if (staleSessionCleared) {
    clearSessionStartedCookie(supabaseResponse);
  }
  return { supabase, user, supabaseResponse, staleSessionCleared };
}
