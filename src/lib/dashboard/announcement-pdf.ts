/** Max PDF size for Mission Update attachments (7 MB). */
export const ANNOUNCEMENT_PDF_MAX_BYTES = 7 * 1024 * 1024;

export const ANNOUNCEMENT_PDF_UPLOAD_PREFIX = "/uploads/announcement-pdfs/";

export function isPdfMagic(buf: ArrayBuffer | Uint8Array): boolean {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf.slice(0, 5));
  if (u.length < 5) return false;
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46 && u[4] === 0x2d;
}

/** Accept same-origin upload paths or absolute https URLs. */
export function normalizeAnnouncementPdfUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.startsWith(ANNOUNCEMENT_PDF_UPLOAD_PREFIX) && !s.includes("..")) {
    return s.split("?")[0];
  }
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    if (!u.pathname.toLowerCase().endsWith(".pdf") && !s.toLowerCase().includes(".pdf")) {
      // Allow https URLs that serve PDF without .pdf in path (CDN signed URLs, etc.)
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function normalizeAnnouncementPdfFileName(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().slice(0, 180);
  return s || null;
}
