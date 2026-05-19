/** Normalize profile city for grouping in reports. */
export function normalizeUserCityForReports(raw: string | null | undefined): string {
  const s = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return "Unknown city";
  if (s.length <= 40) return s;
  return `${s.slice(0, 40)}…`;
}

export function cityDisplayLabel(city: string): string {
  if (city === "Unknown city") return city;
  return city
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}
