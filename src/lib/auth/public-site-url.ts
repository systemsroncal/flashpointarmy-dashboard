/**
 * Base URL for Supabase redirect links (password recovery, etc.).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://dashboard.example.com).
 */
export function getPublicSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  return "http://localhost:3000";
}
