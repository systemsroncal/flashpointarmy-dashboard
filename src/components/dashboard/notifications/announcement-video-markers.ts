/**
 * Video markers inside notification HTML (rich text + Plyr).
 * Prefer shortcodes — TinyMCE preserves them better than custom empty divs.
 */

export const ANNOUNCEMENT_PLYR_BLOCK_CLASS = "fpa-announcement-plyr";

/** Pair form (recommended): [fpa_video]https://youtu.be/xxx[/fpa_video] */
const RE_FPA_PAIR = /\[fpa_video\]([\s\S]*?)\[\/fpa_video\]/gi;

/** Attribute form: [fpa_video url="https://..."] */
const RE_FPA_ATTR = /\[fpa_video\s+url\s*=\s*"([^"]+)"\s*\/?\]/gi;

/** Compatibility: [video url=https://... ] (URL without spaces; trims before ]) */
const RE_VIDEO_ALIAS = /\[video\s+url\s*=\s*(\S+?)\s*\]/gi;

function normalizeCapturedUrl(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  try {
    if (/%[0-9a-f]{2}/i.test(s)) s = decodeURIComponent(s);
  } catch {
    /* keep */
  }
  return s.replace(/%5D/gi, "]").replace(/%5B/gi, "[").trim();
}

export type VideoMarker = { start: number; end: number; url: string };

function findRegexMarkers(html: string, re: RegExp): VideoMarker[] {
  const out: VideoMarker[] = [];
  const r = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(html)) !== null) {
    const url = normalizeCapturedUrl(m[1]);
    if (!url) continue;
    out.push({ start: m.index, end: m.index + m[0].length, url });
  }
  return out;
}

/** Legacy TinyMCE div (any inner HTML between open/close). */
function findLegacyDivMarkers(html: string): VideoMarker[] {
  const classFirst =
    /<div\s[^>]*\bclass="[^"]*\bfpa-announcement-plyr\b[^"]*"[^>]*\bdata-video-url="([^"]+)"[^>]*>[\s\S]*?<\/div>/gi;
  const dataFirst =
    /<div\s[^>]*\bdata-video-url="([^"]+)"[^>]*\bclass="[^"]*\bfpa-announcement-plyr\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
  const seen = new Set<string>();
  const out: VideoMarker[] = [];
  for (const re of [classFirst, dataFirst]) {
    const r = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = r.exec(html)) !== null) {
      const key = `${m.index}:${m.index + m[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const url = normalizeCapturedUrl(m[1]);
      if (!url) continue;
      out.push({ start: m.index, end: m.index + m[0].length, url });
    }
  }
  return out;
}

function mergeNonOverlapping(sorted: VideoMarker[]): VideoMarker[] {
  const out: VideoMarker[] = [];
  for (const m of sorted) {
    const prev = out[out.length - 1];
    if (prev && m.start < prev.end) continue;
    out.push(m);
  }
  return out;
}

export function findAllVideoMarkers(html: string): VideoMarker[] {
  const s = typeof html === "string" ? html : "";
  if (!s.trim()) return [];
  const all = [
    ...findRegexMarkers(s, RE_FPA_PAIR),
    ...findRegexMarkers(s, RE_FPA_ATTR),
    ...findRegexMarkers(s, RE_VIDEO_ALIAS),
    ...findLegacyDivMarkers(s),
  ];
  all.sort((a, b) => a.start - b.start);
  return mergeNonOverlapping(all);
}

export function announcementPlainTextPreview(html: string): string {
  const s = typeof html === "string" ? html : "";
  let t = s;
  t = t.replace(RE_FPA_PAIR, " ");
  t = t.replace(RE_FPA_ATTR, " ");
  t = t.replace(RE_VIDEO_ALIAS, " ");
  t = t.replace(
    /<div\s[^>]*\bfpa-announcement-plyr\b[^>]*>[\s\S]*?<\/div>/gi,
    " "
  );
  return t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
