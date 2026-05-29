import { usStateByCode } from "@/data/usStates";

export type ChapterSearchRow = {
  id: string;
  name: string;
  city: string | null;
  state: string;
  zip_code?: string | null;
  address_line?: string | null;
};

/** Unique state codes present in a chapter list, sorted by state name. */
export function statesFromChapters(chapters: ChapterSearchRow[]): string[] {
  const set = new Set(chapters.map((c) => (c.state ?? "").trim().toUpperCase()).filter(Boolean));
  return [...set].sort((a, b) => {
    const nameA = usStateByCode(a)?.name ?? a;
    const nameB = usStateByCode(b)?.name ?? b;
    return nameA.localeCompare(nameB);
  });
}

/** Chapters optionally scoped to a state code (`all` = no filter). */
export function chaptersForStateFilter(
  chapters: ChapterSearchRow[],
  stateCode: string
): ChapterSearchRow[] {
  if (stateCode === "all") return chapters;
  const st = stateCode.trim().toUpperCase();
  return chapters.filter((c) => (c.state ?? "").trim().toUpperCase() === st);
}

/** Filter rows by primary chapter id and/or state (via chapter list). */
export function matchesStateChapterFilter(
  primaryChapterId: string | null | undefined,
  chapters: ChapterSearchRow[],
  filterState: string,
  filterChapterId: string
): boolean {
  if (filterChapterId !== "all") {
    return primaryChapterId === filterChapterId;
  }
  if (filterState !== "all") {
    const allowed = new Set(chaptersForStateFilter(chapters, filterState).map((c) => c.id));
    return Boolean(primaryChapterId && allowed.has(primaryChapterId));
  }
  return true;
}

/** Display label in dropdowns (name + location). */
export function chapterOptionLabel(c: ChapterSearchRow): string {
  const st = (c.state ?? "").trim().toUpperCase();
  const city = (c.city ?? "").trim();
  const loc = city && st ? `${city}, ${st}` : st || city;
  return loc ? `${c.name} — ${loc}` : c.name;
}

/** Filter control: state — chapter name */
export function chapterFilterOptionLabel(c: ChapterSearchRow): string {
  const st = (c.state ?? "").trim().toUpperCase();
  return st ? `${st} — ${c.name}` : c.name;
}

function chapterSearchBlob(c: ChapterSearchRow, includeNameAndAddress: boolean): string {
  const st = (c.state ?? "").trim().toUpperCase();
  const stateName = usStateByCode(st)?.name ?? "";
  const parts: string[] = [];
  if (includeNameAndAddress) {
    parts.push(c.name, c.address_line ?? "");
  }
  parts.push(c.city ?? "", st, stateName, c.zip_code ?? "");
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function filterChapterSearchOptions(
  options: ChapterSearchRow[],
  query: string,
  includeNameAndAddress: boolean
): ChapterSearchRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((c) => chapterSearchBlob(c, includeNameAndAddress).includes(q));
}
