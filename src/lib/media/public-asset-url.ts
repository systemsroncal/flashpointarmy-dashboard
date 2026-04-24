/**
 * Ensures paths stored as `uploads/...` resolve from the site root (not relative to `/events/...`).
 */
export function publicAssetSrc(url: string): string {
  const t = url.trim();
  if (!t) return t;
  if (
    t.startsWith("http://") ||
    t.startsWith("https://") ||
    t.startsWith("//") ||
    t.startsWith("data:")
  ) {
    return t;
  }
  return t.startsWith("/") ? t : `/${t}`;
}
