/** Shared default resource seeded into every Mobilize group. */
export const MOBILIZE_DEFAULT_CODE_OF_CONDUCT = {
  title: "FPA Code of Conduct",
  url: "/uploads/FPA-Code-of-Conduct.pdf",
  file_name: "FPA-Code-of-Conduct.pdf",
  resource_type: "document" as const,
};

export const MOBILIZE_RESOURCE_UPLOAD_PREFIX = "/uploads/mobilize-resources/";

/** Max bytes streamed by the resource PDF proxy (7 MB, same as Mission Updates). */
export const MOBILIZE_RESOURCE_PDF_MAX_BYTES = 7 * 1024 * 1024;

function hasPdfExtension(pathname: string): boolean {
  return pathname.toLowerCase().split("?")[0].endsWith(".pdf");
}

/**
 * Accepts uploaded documents (local paths) and external `https` links that point to a `.pdf`.
 * Returns the canonical URL to store, or `null` when the value is not allowed.
 */
export function normalizeMobilizeDocumentUrl(raw: unknown): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;

  if (t.startsWith("/")) {
    if (t.includes("..")) return null;
    const clean = t.split("?")[0];
    if (clean.startsWith(MOBILIZE_RESOURCE_UPLOAD_PREFIX)) return clean;
    if (clean === MOBILIZE_DEFAULT_CODE_OF_CONDUCT.url) return clean;
    return null;
  }

  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return null;
    if (!hasPdfExtension(u.pathname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Document URLs allowed for Mobilize group resources. */
export function isAllowedMobilizeDocumentUrl(url: string): boolean {
  return normalizeMobilizeDocumentUrl(url) !== null;
}

/** True when the stored document URL can be rendered by the in-app PDF viewer. */
export function isMobilizePdfUrl(url: string | null | undefined): boolean {
  const normalized = normalizeMobilizeDocumentUrl(url ?? "");
  if (!normalized) return false;
  try {
    return hasPdfExtension(new URL(normalized).pathname);
  } catch {
    return hasPdfExtension(normalized);
  }
}

/** Best-effort file name for external PDF links (used when the leader pastes a URL). */
export function mobilizePdfFileNameFromUrl(url: string): string {
  const normalized = normalizeMobilizeDocumentUrl(url);
  if (!normalized) return "";
  const pathname = normalized.startsWith("/") ? normalized : new URL(normalized).pathname;
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(last).slice(0, 180);
}
