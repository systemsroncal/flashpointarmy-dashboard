import { createBrowserClient } from "@supabase/ssr";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/utils/supabase/public-env";

/**
 * Browser Supabase client. Requires NEXT_PUBLIC_SUPABASE_URL and either
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 * in .env.local — restart `next dev` after changing env.
 */
export const createClient = () => {
  const url = getPublicSupabaseUrl();
  const key = getPublicSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration: set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local, then restart the dev server."
    );
  }
  try {
    // Fail fast if URL is not usable (avoids opaque "Failed to fetch")
    new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not a valid URL (current value: "${url.slice(0, 40)}…").`
    );
  }
  const isDev = process.env.NODE_ENV === "development";
  return createBrowserClient(url, key, {
    ...(isDev
      ? {
          global: {
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
              try {
                return await fetch(input, init);
              } catch (err) {
                console.error(
                  "[Supabase] Network failure to Auth/API. Check URL and anon key in .env.local, VPN/firewall, and that the project is not paused.",
                  { url: String(input), error: err }
                );
                throw err;
              }
            },
          },
        }
      : {}),
  });
};
