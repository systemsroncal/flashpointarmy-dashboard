/** Default cover used when profiles.cover_url is empty. */
export const DEFAULT_PROFILE_COVER_URL =
  "https://fparmychapters.com/wp-content/uploads/2026/07/image-cover-profile-right-scaled.jpg";

export function resolveProfileCoverUrl(coverUrl: string | null | undefined): string {
  const t = coverUrl?.trim();
  return t || DEFAULT_PROFILE_COVER_URL;
}
