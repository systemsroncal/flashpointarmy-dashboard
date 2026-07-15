import DOMPurify from "isomorphic-dompurify";

const FEED_HTML_OPTIONS = {
  USE_PROFILES: { html: true },
} as const;

/** Sanitize rich-text HTML before storing or rendering in mobilize feeds. */
export function sanitizeFeedHtml(raw: string): string {
  return DOMPurify.sanitize(raw.trim(), FEED_HTML_OPTIONS).trim();
}

/** Plain-text fallback for notifications, search, and legacy plain content fields. */
export function plainTextFromHtml(html: string): string {
  const stripped = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
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
