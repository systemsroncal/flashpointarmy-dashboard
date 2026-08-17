import { findAllVideoMarkers } from "@/components/dashboard/notifications/announcement-video-markers";
import { resolveVideoForPlyr } from "@/lib/media/resolve-plyr-video";

/**
 * Rich-text editors store videos as `[fpa_video]URL[/fpa_video]`, but showing that
 * shortcode to authors is confusing. Inside the editor we swap it for a
 * non-editable poster block and swap it back when reading the content out.
 */
export const VIDEO_BLOCK_CLASS = "fpa-video-block";

/** Markup uses only span/img children so the closing tag match stays unambiguous. */
const VIDEO_BLOCK_RE = new RegExp(
  `<div[^>]*class="[^"]*${VIDEO_BLOCK_CLASS}[^"]*"[^>]*>[\\s\\S]*?</div>`,
  "gi"
);

const VIDEO_BLOCK_URL_RE = /data-video-url="([^"]*)"/i;

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** YouTube is the only provider with a thumbnail we can build without an API call. */
function posterImageUrl(url: string): string | null {
  const resolved = resolveVideoForPlyr(url);
  if (resolved.kind !== "youtube") return null;
  return `https://i.ytimg.com/vi/${resolved.videoId}/hqdefault.jpg`;
}

function shortLabel(url: string): string {
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    return `${u.hostname.replace(/^www\./i, "")}${u.pathname}`.slice(0, 64);
  } catch {
    return trimmed.slice(0, 64);
  }
}

export function buildVideoBlockHtml(url: string): string {
  const clean = url.trim();
  const safeUrl = escapeAttribute(clean);
  const poster = posterImageUrl(clean);
  const thumb = poster
    ? `<img class="${VIDEO_BLOCK_CLASS}__thumb" src="${escapeAttribute(poster)}" alt="" />`
    : "";
  return (
    `<div class="${VIDEO_BLOCK_CLASS}" data-video-url="${safeUrl}" contenteditable="false">` +
    thumb +
    `<span class="${VIDEO_BLOCK_CLASS}__play"></span>` +
    `<span class="${VIDEO_BLOCK_CLASS}__label">${escapeAttribute(shortLabel(clean))} — click to change</span>` +
    `</div>`
  );
}

/** Editor input: `[fpa_video]URL[/fpa_video]` (and legacy forms) become poster blocks. */
export function shortcodesToVideoBlocks(html: string): string {
  const source = typeof html === "string" ? html : "";
  if (!source.trim()) return source;
  const markers = findAllVideoMarkers(source);
  if (!markers.length) return source;

  let out = "";
  let last = 0;
  for (const marker of markers) {
    out += source.slice(last, marker.start);
    out += buildVideoBlockHtml(marker.url);
    last = marker.end;
  }
  out += source.slice(last);
  // A block-level poster inside <p> would make the editor split the paragraph.
  return out.replace(
    new RegExp(
      `<p[^>]*>\\s*(<div[^>]*class="[^"]*${VIDEO_BLOCK_CLASS}[^"]*"[^>]*>[\\s\\S]*?</div>)\\s*</p>`,
      "gi"
    ),
    "$1"
  );
}

/** Editor output: poster blocks become the canonical shortcode again. */
export function videoBlocksToShortcodes(html: string): string {
  const source = typeof html === "string" ? html : "";
  if (!source.trim()) return source;
  return source.replace(VIDEO_BLOCK_RE, (block) => {
    const match = block.match(VIDEO_BLOCK_URL_RE);
    const url = unescapeAttribute(match?.[1] ?? "").trim();
    if (!url) return "";
    return `[fpa_video]${url.replace(/\]/g, "%5D")}[/fpa_video]`;
  });
}

export const VIDEO_BLOCK_CONTENT_STYLE = `
.${VIDEO_BLOCK_CLASS} {
  position: relative;
  display: block;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 16 / 9;
  margin: 10px 0;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(135deg, #1f2937, #0f172a);
  cursor: pointer;
  user-select: none;
}
.${VIDEO_BLOCK_CLASS}__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.${VIDEO_BLOCK_CLASS}__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 13px 0 13px 22px;
  border-color: transparent transparent transparent #ffffff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.55));
}
.${VIDEO_BLOCK_CLASS}__label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 6px 9px;
  font-size: 12px;
  line-height: 1.3;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;
