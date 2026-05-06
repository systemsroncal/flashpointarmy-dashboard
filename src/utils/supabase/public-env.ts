/** Public Supabase URL + anon key (browser + server cookie client). */

export function getPublicSupabaseUrl(): string {
  let u = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (u.endsWith("/")) u = u.slice(0, -1);
  return u;
}

/** Supports both project naming and the name used in Supabase docs. */
export function getPublicSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
}
