import { findAllVideoMarkers } from "@/components/dashboard/notifications/announcement-video-markers";

export function extractImageSrcsFromHtml(html: string): string[] {
  const s = typeof html === "string" ? html : "";
  if (!s.trim()) return [];
  const out: string[] = [];
  const re = /<img\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const src = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (src && !out.includes(src)) out.push(src);
  }
  return out;
}

/** HTML without embedded images or video markers (for collapsed text clamp). */
export function stripAnnouncementMediaFromHtml(html: string): string {
  let s = typeof html === "string" ? html : "";
  if (!s.trim()) return "";

  for (const mk of [...findAllVideoMarkers(s)].sort((a, b) => b.start - a.start)) {
    s = s.slice(0, mk.start) + s.slice(mk.end);
  }
  s = s.replace(/<img\b[^>]*>/gi, "");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}