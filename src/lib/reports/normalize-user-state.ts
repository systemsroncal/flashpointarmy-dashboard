/** Normalize profile state for reports grouping (US-style 2-letter codes when possible). */
export function normalizeUserStateForReports(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "Unknown";
  const upper = s.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  if (upper.length <= 24) return upper;
  return `${upper.slice(0, 24)}…`;
}
