import type { MobilizeGroupStateInfo } from "@/lib/mobilize/group-state-flag";

export const MOBILIZE_DEFAULT_CHAPTER_COVER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/07/Chapters-Cover.jpg";

export const MOBILIZE_CHAPTER_FEED_BANNER_ASPECT = "16 / 9" as const;

export function mobilizeChapterCoverSrc(coverUrl?: string | null): string {
  const trimmed = coverUrl?.trim();
  return trimmed || MOBILIZE_DEFAULT_CHAPTER_COVER_URL;
}

/** Primary banner title, e.g. "Alabama Chapter" → "ALABAMA". */
export function mobilizeChapterBannerHeading(
  groupName: string,
  stateInfo?: MobilizeGroupStateInfo | null
): string {
  if (stateInfo?.name) return stateInfo.name.toUpperCase();
  const stripped = groupName.replace(/\s+chapter\s*$/i, "").trim();
  return (stripped || groupName).toUpperCase();
}
