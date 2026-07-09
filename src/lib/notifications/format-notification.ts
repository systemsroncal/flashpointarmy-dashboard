/**
 * Normalizes legacy notification rows (old audit payloads / manual.* titles)
 * for display in the UI.
 */
import { scrubPrivacyNamesInText } from "@/lib/user/format-privacy-name";

export function formatNotificationDisplay(n: {
  title: string;
  body: string | null;
}): { title: string; body: string | null } {
  let title = (n.title ?? "").trim() || "Notification";
  let body = n.body?.trim() ?? null;

  if (body) {
    const idx = body.lastIndexOf("{");
    if (idx >= 0) {
      try {
        const j = JSON.parse(body.slice(idx)) as Record<string, unknown>;
        if (typeof j.title === "string" && j.title.trim()) {
          title = j.title.trim();
        }
        const sub = j.text ?? j.body ?? j.note ?? j.summary;
        if (typeof sub === "string" && sub.trim()) {
          body = sub.trim();
        } else if (typeof j.title === "string") {
          body = null;
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (/^manual\.\w+$/i.test(title)) {
    title = "Manual log";
  }

  // Remap legacy notification titles (pre-label rename)
  if (title === "New chapter" || /^New chapter:/i.test(title)) {
    title = title.replace(/^New chapter/i, "Chapter request");
  }
  if (title === "Local leader assigned") {
    title = "Local leader application";
  }

  if (body) {
    body = body
      .replace(/^manual\.\w+\s*·\s*manual\s*·\s*/i, "")
      .replace(/^\{[\s\S]*\}$/, "")
      .trim();
    if (body === title) body = null;
  }

  return {
    title: scrubPrivacyNamesInText(title),
    body: body ? scrubPrivacyNamesInText(body) : null,
  };
}
