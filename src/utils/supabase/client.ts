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
      "Falta configuración de Supabase: define NEXT_PUBLIC_SUPABASE_URL y " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en .env.local y reinicia el servidor de desarrollo."
    );
  }
  try {
    // Fail fast if URL is not usable (avoids opaque "Failed to fetch")
    new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL no es una URL válida (valor actual: "${url.slice(0, 40)}…").`
    );
  }
  return createBrowserClient(url, key);
};
