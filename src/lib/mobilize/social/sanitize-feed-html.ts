import { announcementPlainTextPreview } from "@/components/dashboard/notifications/announcement-video-markers";
import DOMPurify from "isomorphic-dompurify";

const FEED_HTML_OPTIONS = {
  USE_PROFILES: { html: true },
} as const;

/** Remove trailing empty blocks/br so posts don't show blank space at the bottom. */
export function trimTrailingFeedHtml(html: string): string {
  let s = typeof html === "string" ? html : "";
  if (!s) return "";

  const trailingEmptyBlock =
    /(?:<(?:p|div)(?:\s[^>]*)?>\s*(?:<br\s*\/?>|&nbsp;|\u00a0|\s|<span[^>]*>\s*(?:&nbsp;|\u00a0|\s)*<\/span>)*\s*<\/(?:p|div)>\s*)+$/i;
  const trailingBr = /(?:<br\s*\/?>\s*)+$/i;

  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(trailingEmptyBlock, "");
    s = s.replace(trailingBr, "");
    s = s.replace(/\s+$/u, "");
  }
  return s;
}

/** Sanitize rich-text HTML before storing or rendering in mobilize feeds. */
export function sanitizeFeedHtml(raw: string): string {
  const sanitized = DOMPurify.sanitize(raw.trim(), FEED_HTML_OPTIONS).trim();
  return trimTrailingFeedHtml(sanitized);
}

/** Plain-text fallback for notifications, search, and legacy plain content fields. */
export function plainTextFromHtml(html: string): string {
  const withoutVideo = announcementPlainTextPreview(html);
  const stripped = DOMPurify.sanitize(withoutVideo, { ALLOWED_TAGS: [] });
  return stripped.replace(/\s+/g, " ").trim();
}

export function normalizeFeedContent(input: {
  content?: string;
  content_html?: string;
}): { content: string; content_html: string | null } {
  const rawHtml = typeof input.content_html === "string" ? input.content_html.trim() : "";
  if (rawHtml) {
    const content_html = sanitizeFeedHtml(rawHtml);
    const content = plainTextFromHtml(content_html);
    return { content, content_html: content_html || null };
  }
  const content = String(input.content ?? "").trim();
  return { content, content_html: null };
}
