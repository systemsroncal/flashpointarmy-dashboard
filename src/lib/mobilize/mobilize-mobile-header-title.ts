import {
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_MY_CHAPTERS_HREF,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";

/** Facebook-style mobile title bar (hamburger + title) for primary Mobilize hubs. */
export function resolveMobilizeMobileHeaderTitle(pathname: string): string | null {
  if (pathname === MOBILIZE_HOME_HREF || pathname === MOBILIZE_PREFIX) {
    return "Feed";
  }
  if (pathname === MOBILIZE_CHAPTERS_HREF) {
    return "Chapters";
  }
  if (pathname === MOBILIZE_MY_CHAPTERS_HREF) {
    return "My Groups";
  }
  return null;
}

export function isMobilizeMobileTitleHeaderPage(pathname: string): boolean {
  return resolveMobilizeMobileHeaderTitle(pathname) !== null;
}