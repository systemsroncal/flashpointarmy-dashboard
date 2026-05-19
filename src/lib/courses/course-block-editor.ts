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

export function payloadUrl(payload: unknown): string {
  return String((payload as { url?: string } | null)?.url ?? "").trim();
}

/** @deprecated Use {@link payloadUrl}. */
export const videoPayloadUrl = payloadUrl;

export const ELEMENT_TYPES_REQUIRING_URL = ["video", "pdf", "image"] as const;

export function elementTypeRequiresUrl(elementType: string): boolean {
  return (ELEMENT_TYPES_REQUIRING_URL as readonly string[]).includes(elementType);
}

export function urlFieldLabelForElementType(elementType: string): string {
  switch (elementType) {
    case "video":
      return "Video URL";
    case "pdf":
      return "PDF URL";
    case "image":
      return "Image URL";
    default:
      return "URL";
  }
}

export type CourseBlockValidationIssue = {
  elementId: string;
  sessionId: string;
  sessionTitle: string;
  elementType: string;
  elementTypeLabel: string;
  blockTitlePlain: string;
  fieldLabel: string;
};

export function collectCourseBlockValidationIssues(
  sessions: Array<{
    id: string;
    title: string;
    elements: Array<{ id: string; element_type: string; title_html: string; payload: unknown }>;
  }>
): CourseBlockValidationIssue[] {
  const issues: CourseBlockValidationIssue[] = [];
  for (const session of sessions) {
    const sessionTitle = session.title.trim() || "Untitled session";
    for (const el of session.elements) {
      if (!elementTypeRequiresUrl(el.element_type)) continue;
      if (payloadUrl(el.payload)) continue;
      issues.push({
        elementId: el.id,
        sessionId: session.id,
        sessionTitle,
        elementType: el.element_type,
        elementTypeLabel: COURSE_ELEMENT_TYPE_LABELS[el.element_type] ?? el.element_type,
        blockTitlePlain: blockTitlePlainFromHtml(el.title_html),
        fieldLabel: urlFieldLabelForElementType(el.element_type),
      });
    }
  }
  return issues;
}

export function formatCourseBlockValidationIssue(issue: CourseBlockValidationIssue): string {
  const titlePart = issue.blockTitlePlain ? ` “${issue.blockTitlePlain}”` : "";
  return `Session “${issue.sessionTitle}”: ${issue.elementTypeLabel}${titlePart} — ${issue.fieldLabel} is required`;
}

export const COURSE_ELEMENT_TYPE_LABELS: Record<string, string> = {
  plain_text: "Plain text",
  rich_text: "Rich text",
  video: "Video",
  pdf: "PDF",
  image: "Image",
  quiz: "Quiz",
};
