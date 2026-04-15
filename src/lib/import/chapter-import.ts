import type { SupabaseClient } from "@supabase/supabase-js";
import {
  pickChapterName,
  pickField,
  parseCityFromAddress,
  parseZipFromAddress,
  type FlatRow,
} from "./bulk-import";
import { resolveChapterUsState } from "./us-state";

export type ChapterRow = {
  id: string;
  name: string;
  city: string | null;
  state: string;
  zip_code: string | null;
};

function chooseChapterByHeuristic(chapters: ChapterRow[], zip: string, city: string, state: string) {
  if (chapters.length === 0) return null;
  const z = zip.slice(0, 5);
  const byZip = z ? chapters.find((c) => (c.zip_code || "").startsWith(z)) : null;
  if (byZip) return byZip;
  const cityLower = city.toLowerCase();
  const stateUpper = state.toUpperCase();
  const byCity = chapters.find(
    (c) => (c.city || "").toLowerCase() === cityLower && c.state.toUpperCase() === stateUpper
  );
  if (byCity) return byCity;
  const byState = stateUpper ? chapters.find((c) => c.state.toUpperCase() === stateUpper) : null;
  return byState ?? chapters[0];
}

/**
 * Finds a chapter by name (case-insensitive) or creates one from the row (Address / State / ZIP).
 * Used by leaders import and optional member import when a chapter name column is present.
 */
export async function findOrCreateChapterByImportRow(
  admin: SupabaseClient,
  row: FlatRow,
  createdByUserId: string
): Promise<{ chapter: ChapterRow; created: boolean } | { error: string }> {
  const chapterName = pickChapterName(row).trim();
  if (!chapterName) {
    return { error: "Missing chapter name." };
  }
  const address = pickField(row, ["Address", "address"]);
  const churchStateRaw = pickField(row, ["Church State", "State", "state", "Church state"]);
  const city = parseCityFromAddress(address) || pickField(row, ["City", "city"]);
  const zip = parseZipFromAddress(address) || pickField(row, ["ZIP code", "Zip", "zip"]);
  const stateResolved = resolveChapterUsState({ churchStateRaw, address });
  if ("error" in stateResolved) {
    return { error: stateResolved.error };
  }
  const state = stateResolved.code;

  const { data: chapterByName } = await admin
    .from("chapters")
    .select("id,name,city,state,zip_code")
    .ilike("name", chapterName)
    .limit(1)
    .maybeSingle();

  if (chapterByName?.id) {
    return { chapter: chapterByName as ChapterRow, created: false };
  }

  const { data: insertedChapter, error: chapterErr } = await admin
    .from("chapters")
    .insert({
      name: chapterName,
      address_line: address || null,
      city: city || null,
      state,
      zip_code: zip || null,
      status: "approved",
      created_by: createdByUserId,
    })
    .select("id,name,city,state,zip_code")
    .single();

  if (chapterErr || !insertedChapter?.id) {
    return { error: chapterErr?.message || "Could not create chapter." };
  }

  return { chapter: insertedChapter as ChapterRow, created: true };
}

/**
 * Member import: if the row names a chapter, find or create it; otherwise match by ZIP/city/state.
 */
export async function resolveChapterForMemberImport(
  admin: SupabaseClient,
  row: FlatRow,
  chapters: ChapterRow[],
  importingUserId: string
): Promise<{ chapter: ChapterRow; chapters: ChapterRow[] } | { error: string }> {
  const named = pickChapterName(row).trim();
  const address = pickField(row, ["Address", "address"]);
  const zip = parseZipFromAddress(address) || pickField(row, ["ZIP code", "Zip", "zip"]);
  const city = pickField(row, ["City", "city"]) || "";
  const churchStateRaw = pickField(row, ["Church State", "State", "state", "Church state"]);
  const stateResolved = resolveChapterUsState({ churchStateRaw, address });
  const state = "error" in stateResolved ? "" : stateResolved.code;

  if (named) {
    const res = await findOrCreateChapterByImportRow(admin, row, importingUserId);
    if ("error" in res) {
      return { error: res.error };
    }
    let next = chapters;
    if (res.created && !next.some((c) => c.id === res.chapter.id)) {
      next = [...next, res.chapter];
    }
    return { chapter: res.chapter, chapters: next };
  }

  const chapter = chooseChapterByHeuristic(chapters, zip, city, state);
  if (!chapter) {
    return { error: "No chapter available. Import chapters first, or add a chapter name column to each row." };
  }
  return { chapter, chapters };
}
