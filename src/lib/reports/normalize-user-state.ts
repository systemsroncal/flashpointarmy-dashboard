import { US_STATES } from "@/data/usStates";

/** Normalize profile state for reports grouping (USPS code when possible). */
export function normalizeUserStateForReports(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "Unknown";
  const upper = s.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const byName = US_STATES.find((st) => st.name.toUpperCase() === upper);
  if (byName) return byName.code;
  if (upper.length <= 24) return upper;
  return `${upper.slice(0, 24)}…`;
}

export function stateDisplayNameForReports(code: string): string {
  if (code === "Unknown") return "Unknown";
  const row = US_STATES.find((s) => s.code === code);
  return row?.name ?? code;
}
