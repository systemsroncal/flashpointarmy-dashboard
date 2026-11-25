/** Long site name for OG titles, emails, and share copy. */
export const APP_DISPLAY_NAME =
  "FlashPoint Army Chapters Command Center - Connect. Grow. Lead. Mobile. Impact Your City.";

/** Shorter label used in subjects and UI chips. */
export const APP_SHORT_NAME = "FlashPoint Army Chapters Command Center";

export const DEFAULT_SHARE_META_IMAGE =
  "https://fparmychapters.com/wp-content/uploads/2026/04/Metaimg-FP-army.png";

export function sharePageTitle(contentTitle: string): string {
  const t = contentTitle.trim();
  if (!t) return APP_DISPLAY_NAME;
  return `${t} | ${APP_DISPLAY_NAME}`;
}