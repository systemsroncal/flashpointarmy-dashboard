import {
  MOBILIZE_ALERTS_HREF,
  MOBILIZE_BOOKMARKS_HREF,
  MOBILIZE_HOME_HREF,
  MOBILIZE_MESSAGES_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_PREFIX,
  MOBILIZE_SOCIAL_SETTINGS_HREF,
} from "@/lib/mobilize/mobilize-nav-config";

export type MobilizeSocialNavKey =
  | "search"
  | "home"
  | "alerts"
  | "messages"
  | "groups"
  | "bookmarks"
  | "profile"
  | "settings";

export type MobilizeSocialNavItem = {
  key: MobilizeSocialNavKey;
  label: string;
  href: string;
  /** Bottom bar uses shorter labels on narrow screens. */
  shortLabel?: string;
};

export function mobilizeSocialNavItems(profileHref: string): MobilizeSocialNavItem[] {
  return [
    { key: "search", label: "Search", href: MOBILIZE_HOME_HREF, shortLabel: "Search" },
    { key: "home", label: "Home", href: MOBILIZE_HOME_HREF, shortLabel: "Home" },
    { key: "alerts", label: "Alerts", href: MOBILIZE_ALERTS_HREF, shortLabel: "Alerts" },
    { key: "messages", label: "Messages", href: MOBILIZE_MESSAGES_HREF, shortLabel: "Msgs" },
    { key: "groups", label: "Groups", href: MOBILIZE_MY_GROUPS_HREF, shortLabel: "Groups" },
    { key: "bookmarks", label: "Bookmarks", href: MOBILIZE_BOOKMARKS_HREF, shortLabel: "Saved" },
    { key: "profile", label: "Profile", href: profileHref, shortLabel: "Profile" },
    {
      key: "settings",
      label: "Settings",
      href: MOBILIZE_SOCIAL_SETTINGS_HREF,
      shortLabel: "Settings",
    },
  ];
}

export function isMobilizeSocialNavActive(
  key: MobilizeSocialNavKey,
  pathname: string,
  profileHref: string
): boolean {
  if (key === "search") return false;
  if (key === "home") {
    return pathname === MOBILIZE_HOME_HREF || pathname === MOBILIZE_PREFIX;
  }
  if (key === "profile") return pathname === profileHref;
  if (key === "groups") return pathname.startsWith(MOBILIZE_MY_GROUPS_HREF);
  if (key === "settings") return pathname.startsWith(MOBILIZE_SOCIAL_SETTINGS_HREF);
  const item = mobilizeSocialNavItems(profileHref).find((i) => i.key === key);
  return item ? pathname.startsWith(item.href) : false;
}
