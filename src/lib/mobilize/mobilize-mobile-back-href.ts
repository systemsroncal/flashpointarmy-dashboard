import { MOBILIZE_PREFIX } from "@/lib/mobilize/mobilize-nav-config";
import { resolveMobilizeProfileBackHref } from "@/lib/mobilize/social/profile-href";

/**
 * Mobile Mobilize app bar back target (no hamburger — exit or parent screen).
 */
export function resolveMobilizeMobileBackHref(pathname: string, search: URLSearchParams): string {
  const path = pathname.replace(/\/+$/, "") || MOBILIZE_PREFIX;

  if (path.startsWith(`${MOBILIZE_PREFIX}/profile/`)) {
    return resolveMobilizeProfileBackHref(search);
  }

  const chapterGroups = path.match(new RegExp(`^${MOBILIZE_PREFIX}/groups/([^/]+)/groups$`));
  if (chapterGroups) {
    return `${MOBILIZE_PREFIX}/groups/${chapterGroups[1]}`;
  }

  const groupDetail = path.match(new RegExp(`^${MOBILIZE_PREFIX}/groups/([^/]+)$`));
  if (groupDetail) {
    return `${MOBILIZE_PREFIX}/my-groups`;
  }

  if (path === MOBILIZE_PREFIX || path === `${MOBILIZE_PREFIX}/home`) {
    return "/dashboard";
  }

  if (path.startsWith(`${MOBILIZE_PREFIX}/`)) {
    return `${MOBILIZE_PREFIX}/home`;
  }

  return "/dashboard";
}