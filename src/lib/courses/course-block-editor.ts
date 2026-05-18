/** Plain ↔ stored HTML for optional block titles in the course editor. */
export function blockTitlePlainFromHtml(html: string): string {
  if (!html?.trim()) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function blockTitleHtmlFromPlain(plain: string): string {
  const t = plain.trim();
  if (!t) return "";
  const escaped = t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped}</p>`;
}

export function videoPayloadUrl(payload: unknown): string {
  return String((payload as { url?: string } | null)?.url ?? "").trim();
}

export const COURSE_ELEMENT_TYPE_LABELS: Record<string, string> = {
  plain_text: "Plain text",
  rich_text: "Rich text",
  video: "Video",
  pdf: "PDF",
  image: "Image",
  quiz: "Quiz",
};
