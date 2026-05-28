/**
 * Invite CTA below the national overview map.
 * Enabled on dev/local only for now; hidden on app.fparmychapters.com (prod).
 * Uses NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL from the build environment.
 */
export function isChapterMapInviteCtaEnabled(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).toLowerCase();

  if (base.includes("dev.fparmychapters.com")) return true;
  if (base.includes("localhost") || base.includes("127.0.0.1")) return true;

  return false;
}
