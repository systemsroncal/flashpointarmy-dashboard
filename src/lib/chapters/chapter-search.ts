import { usStateByCode } from "@/data/usStates";

export type ChapterSearchRow = {
  id: string;
  name: string;
  city: string | null;
  state: string;
  zip_code?: string | null;
  address_line?: string | null;
};

/** Display label in dropdowns (name + location). */
export function chapterOptionLabel(c: ChapterSearchRow): string {
  const st = (c.state ?? "").trim().toUpperCase();
  const city = (c.city ?? "").trim();
  const loc = city && st ? `${city}, ${st}` : st || city;
  return loc ? `${c.name} — ${loc}` : c.name;
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
