import type { SupabaseClient } from "@supabase/supabase-js";
import type { FlatRow } from "@/lib/import/bulk-import";
import {
  findOrCreateChapterByImportRow,
  resolveChapterForMemberImport,
  type ChapterRow,
} from "@/lib/import/chapter-import";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolves chapter for Fluent webhooks:
 * - If `primary_chapter_id` is a valid UUID and exists → use it.
 * - Else same logic as Excel bulk import (requires `systemUserId` for create/find).
 */
export async function resolveChapterIdForExternalWebhook(
  admin: SupabaseClient,
  opts: {
    formId: 1 | 4;
    flat: FlatRow;
    primaryChapterId: string;
    systemUserId: string | null;
  }
): Promise<{ chapterId: string; chapterCreated: boolean } | { error: string }> {
  const { formId, flat, primaryChapterId, systemUserId } = opts;
  const trimmed = primaryChapterId.trim();

  if (UUID_RE.test(trimmed)) {
    const { data } = await admin.from("chapters").select("id").eq("id", trimmed).maybeSingle();
    if (!data?.id) {
      return { error: "Chapter not found for primary_chapter_id." };
    }
    return { chapterId: trimmed, chapterCreated: false };
  }

  if (!systemUserId) {
    return {
      error:
        "Provide primary_chapter_id as a valid chapter UUID, or set FLUENT_FORM_SYSTEM_USER_ID and send the same chapter columns as the Excel export (Church / chapter name, Address, State, ZIP, etc.).",
    };
  }

  if (formId === 1) {
    const res = await findOrCreateChapterByImportRow(admin, flat, systemUserId);
    if ("error" in res) return { error: res.error };
    return { chapterId: res.chapter.id, chapterCreated: res.created };
  }

  const { data: chaptersData } = await admin
    .from("chapters")
    .select("id,name,city,state,zip_code")
    .order("name");
  const chapters = (chaptersData ?? []) as ChapterRow[];
  const res = await resolveChapterForMemberImport(admin, flat, chapters, systemUserId);
  if ("error" in res) return { error: res.error };
  return { chapterId: res.chapter.id, chapterCreated: false };
}
