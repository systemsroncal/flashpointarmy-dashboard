import { findAllVideoMarkers } from "@/components/dashboard/notifications/announcement-video-markers";

const IMG_SRC_RE = /<img\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)'|([^\s>]+))/gi;

export function extractImageSrcsFromHtml(html: string): string[] {
  const s = typeof html === "string" ? html : "";
  if (!s.trim()) return [];
  const out: string[] = [];
  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const src = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (src && !out.includes(src)) out.push(src);
  }
  return out;
}

export type AnnouncementFirstMedia =
  | { kind: "image"; src: string }
  | { kind: "video"; url: string };

/** First image or video marker in document order (for collapsed Mission Update preview). */
export function findFirstAnnouncementMedia(html: string): AnnouncementFirstMedia | null {
  const s = typeof html === "string" ? html : "";
  if (!s.trim()) return null;

  type Candidate = AnnouncementFirstMedia & { start: number };
  const candidates: Candidate[] = [];

  const re = new RegExp(IMG_SRC_RE.source, IMG_SRC_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const src = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (src) candidates.push({ kind: "image", src, start: m.index });
  }
  for (const mk of findAllVideoMarkers(s)) {
    candidates.push({ kind: "video", url: mk.url, start: mk.start });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.start - b.start);
  const first = candidates[0];
  if (first.kind === "image") return { kind: "image", src: first.src };
  return { kind: "video", url: first.url };
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