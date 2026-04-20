export type ResolvedPlyrVideo =
  | { kind: "youtube"; videoId: string }
  | { kind: "vimeo"; videoId: string }
  | { kind: "html5"; src: string }
  | { kind: "iframe"; src: string }
  | { kind: "none" };

function tryParseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    try {
      const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      return new URL(withProto);
    } catch {
      return null;
    }
  }
}

function pickYoutubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? id.split("?")[0] : null;
  }
  if (!host.endsWith("youtube.com") && !host.endsWith("youtube-nocookie.com")) {
    return null;
  }
  const path = url.pathname;
  if (path.startsWith("/embed/") || path.startsWith("/shorts/") || path.startsWith("/live/")) {
    const id = path.split("/")[2];
    return id ? id.split("?")[0] : null;
  }
  const v = url.searchParams.get("v");
  if (v) return v;
  return null;
}

function pickVimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (!host.endsWith("vimeo.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last)) return last;
  if (parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1])) return parts[1];
  return null;
}

function pickDailymotionEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (!host.endsWith("dailymotion.com")) return null;
  const m = url.pathname.match(/\/video\/([^/?]+)/);
  if (!m?.[1]) return null;
  const id = m[1];
  return `https://www.dailymotion.com/embed/video/${id}?controls=0&autoplay=1&mute=1`;
}

function looksLikeDirectMedia(pathname: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(pathname);
}

/**
 * Maps a pasted video URL to a Plyr-friendly shape (YouTube/Vimeo providers, HTML5, or generic iframe embed).
 */
export function resolveVideoForPlyr(raw: string): ResolvedPlyrVideo {
  const input = raw.trim();
  if (!input) return { kind: "none" };

  const url = tryParseUrl(input);
  if (!url) return { kind: "none" };

  const yt = pickYoutubeId(url);
  if (yt) return { kind: "youtube", videoId: yt };

  const vm = pickVimeoId(url);
  if (vm) return { kind: "vimeo", videoId: vm };

  const dm = pickDailymotionEmbed(url);
  if (dm) return { kind: "iframe", src: dm };

  const path = url.pathname;
  if (looksLikeDirectMedia(path)) {
    return { kind: "html5", src: input };
  }

  const host = url.hostname.toLowerCase();
  if (host.includes("amazonaws.com") || host.includes("cloudfront.net")) {
    if (looksLikeDirectMedia(path) || /\.(mp4|webm|ogg)(\?|&|$)/i.test(input)) {
      return { kind: "html5", src: input };
    }
  }

  if (path.includes("/embed") || host.includes("player.")) {
    return { kind: "iframe", src: input };
  }

  if (url.protocol === "http:" || url.protocol === "https:") {
    return { kind: "iframe", src: input };
  }

  return { kind: "none" };
}
