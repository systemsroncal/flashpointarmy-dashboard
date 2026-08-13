import type { SupabaseClient } from "@supabase/supabase-js";

export type ChapterZipMatch = {
  id: string;
  name: string;
  zip_code: string | null;
  city: string | null;
  state: string;
};

function digitsZip(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

/**
 * Pick the closest `chapters` row for a US ZIP.
 * Order: exact 5-digit → longer prefix → smallest numeric ZIP distance → first row.
 */
export function pickNearestChapterByZip(
  chapters: ChapterZipMatch[],
  zipRaw: string
): ChapterZipMatch | null {
  if (!chapters.length) return null;
  const zip = digitsZip(zipRaw);
  if (!zip) return chapters[0] ?? null;

  const exact = chapters.find((c) => digitsZip(c.zip_code || "") === zip);
  if (exact) return exact;

  for (let len = Math.min(4, zip.length); len >= 3; len -= 1) {
    const prefix = zip.slice(0, len);
    const byPrefix = chapters.find((c) => digitsZip(c.zip_code || "").startsWith(prefix));
    if (byPrefix) return byPrefix;
  }

  const zipNum = Number.parseInt(zip, 10);
  if (!Number.isFinite(zipNum)) return chapters[0] ?? null;

  let best: ChapterZipMatch | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const c of chapters) {
    const cz = digitsZip(c.zip_code || "");
    if (cz.length < 3) continue;
    const n = Number.parseInt(cz.slice(0, 5).padEnd(5, "0"), 10);
    if (!Number.isFinite(n)) continue;
    const dist = Math.abs(n - zipNum);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best ?? chapters[0] ?? null;
}

/** Load chapters and resolve nearest by ZIP (for registration → primary church). */
export async function findNearestChapterByZip(
  admin: SupabaseClient,
  zipRaw: string
): Promise<ChapterZipMatch | null> {
  const zip = digitsZip(zipRaw);
  if (zip.length < 3) return null;

  const { data, error } = await admin
    .from("chapters")
    .select("id, name, zip_code, city, state")
    .order("name");

  if (error || !data?.length) return null;
  return pickNearestChapterByZip(data as ChapterZipMatch[], zip);
}
