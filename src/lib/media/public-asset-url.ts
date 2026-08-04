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

/** Append `v=` so browsers refetch after same-path overwrites (or pass a stable version). */
export function cacheBustAssetUrl(url: string, version?: string | number | null): string {
  const base = publicAssetSrc(url);
  if (!base || version == null || version === "" || version === 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${encodeURIComponent(String(version))}`;
}

