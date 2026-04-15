import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";

export const createClient = async () => {
  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseKey = getPublicSupabaseAnonKey();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component without session refresh middleware — safe to ignore.
        }
      },
    },
  });
};
