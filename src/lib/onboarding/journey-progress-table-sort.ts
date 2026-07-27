import type { JourneyProgressRow } from "@/lib/onboarding/journey-progress-stats";

export const JOURNEY_PROGRESS_SORT_KEYS = [
  "name",
  "email",
  "role",
  "chapter",
  "course",
  "briefing",
  "missions",
  "progress",
] as const;

export type JourneyProgressSortKey = (typeof JOURNEY_PROGRESS_SORT_KEYS)[number];

export function parseJourneyProgressSortKey(raw: string | null | undefined): JourneyProgressSortKey {
  const s = (raw ?? "").toLowerCase().trim();
  if ((JOURNEY_PROGRESS_SORT_KEYS as readonly string[]).includes(s)) {
    return s as JourneyProgressSortKey;
  }
  return "progress";
}

export function parseJourneyProgressSortAscending(raw: string | null | undefined): boolean {
  return (raw ?? "").toLowerCase().trim() === "asc";
}

function journeyProgressScore(row: JourneyProgressRow): number {
  return (
    (row.course_completed ? 1 : 0) +
    (row.briefing_completed ? 1 : 0) +
    (row.missions_started ? 1 : 0)
  );
}

/** PostgREST column on `dashboard_users` when SQL pagination is used. */
export function journeyProgressSortDbColumn(sort: JourneyProgressSortKey): string {
  switch (sort) {
    case "email":
      return "email";
    case "name":
      return "first_name";
    default:
      return "created_at";
  }
}

export function sortJourneyProgressRows(
  rows: JourneyProgressRow[],
  sort: JourneyProgressSortKey,
  ascending: boolean
): JourneyProgressRow[] {
  const dir = ascending ? 1 : -1;
  const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
    dir * String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
  const cmpBool = (a: boolean, b: boolean) => dir * (Number(a) - Number(b));

  return [...rows].sort((a, b) => {
    switch (sort) {
      case "name":
        return cmpStr(a.name, b.name);
      case "email":
        return cmpStr(a.email, b.email);
      case "role":
        return cmpStr(a.role_label, b.role_label);
      case "chapter":
        return cmpStr(a.chapter_name, b.chapter_name);
      case "course":
        return cmpBool(a.course_completed, b.course_completed) || cmpStr(a.name, b.name);
      case "briefing":
        return cmpBool(a.briefing_completed, b.briefing_completed) || cmpStr(a.name, b.name);
      case "missions":
        return cmpBool(a.missions_started, b.missions_started) || cmpStr(a.name, b.name);
      case "progress": {
        const scoreDiff = dir * (journeyProgressScore(a) - journeyProgressScore(b));
        if (scoreDiff !== 0) return scoreDiff;
        return cmpStr(a.name, b.name);
      }
      default:
        return cmpStr(a.name, b.name);
    }
  });
}
