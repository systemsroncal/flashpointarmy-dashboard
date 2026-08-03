import { publicAssetSrc } from "@/lib/media/public-asset-url";

export const MAX_MOBILIZE_ANNOUNCEMENT_IMAGES = 4;
export const MOBILIZE_ANNOUNCEMENT_UPLOAD_PREFIX = "/uploads/mobilize-announcements/";
export const MOBILIZE_PROFILE_POST_UPLOAD_PREFIX = "/uploads/mobilize-profile-posts/";

export function normalizeAnnouncementImageUrls(
  raw: unknown,
  maxCount: number = MAX_MOBILIZE_ANNOUNCEMENT_IMAGES
): string[] {
  const limit =
    Number.isFinite(maxCount) && maxCount >= 1
      ? Math.min(20, Math.round(maxCount))
      : MAX_MOBILIZE_ANNOUNCEMENT_IMAGES;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (!t) continue;
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

export function isValidAnnouncementImagePath(url: string): boolean {
  const path = publicAssetSrc(url);
  if (!path.startsWith(MOBILIZE_ANNOUNCEMENT_UPLOAD_PREFIX)) return false;
  if (path.includes("..")) return false;
  return true;
}

export function isValidProfilePostImagePath(url: string): boolean {
  const path = publicAssetSrc(url);
  if (!path.startsWith(MOBILIZE_PROFILE_POST_UPLOAD_PREFIX)) return false;
  if (path.includes("..")) return false;
  return true;
}

export function isValidSocialPostImagePath(url: string): boolean {
  return isValidAnnouncementImagePath(url) || isValidProfilePostImagePath(url);
}

export function sanitizeAnnouncementImageUrls(
  urls: unknown,
  maxCount: number = MAX_MOBILIZE_ANNOUNCEMENT_IMAGES
): string[] | null {
  const normalized = normalizeAnnouncementImageUrls(urls, maxCount);
  for (const u of normalized) {
    if (!isValidAnnouncementImagePath(u)) return null;
  }
  return normalized;
}

export function sanitizeSocialPostImageUrls(
  urls: unknown,
  maxCount: number = MAX_MOBILIZE_ANNOUNCEMENT_IMAGES
): string[] | null {
  const normalized = normalizeAnnouncementImageUrls(urls, maxCount);
  for (const u of normalized) {
    if (!isValidSocialPostImagePath(u)) return null;
  }
  return normalized;
}
