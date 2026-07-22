import {
  MOBILIZE_ADMIN_SETTINGS_HREF,
  MOBILIZE_CHAPTERS_HREF,
  MOBILIZE_MY_GROUPS_HREF,
  MOBILIZE_PREFIX,
} from "@/lib/mobilize/mobilize-nav-config";

export type MobilizeChaptersNavKey =
  | "chapter"
  | "groups"
  | "activities"
  | "notifications"
  | "groupsSettings";

export type MobilizeChaptersNavItem = {
  key: MobilizeChaptersNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export function mobilizeChaptersNavItems(showGroupsSettings: boolean): MobilizeChaptersNavItem[] {
  const items: MobilizeChaptersNavItem[] = [
    {
      key: "chapter",
      label: "Chapter",
      shortLabel: "Chapter",
      href: MOBILIZE_CHAPTERS_HREF,
    },
    {
      key: "groups",
      label: "Groups",
      shortLabel: "Groups",
      href: MOBILIZE_MY_GROUPS_HREF,
    },
    {
      key: "activities",
      label: "Upcoming Activities",
      shortLabel: "Activities",
      href: `${MOBILIZE_PREFIX}/activities`,
    },
    {
      key: "notifications",
      label: "Notifications",
      shortLabel: "Alerts",
      href: `${MOBILIZE_PREFIX}/notifications`,
    },
  ];

  if (showGroupsSettings) {
    items.push({
      key: "groupsSettings",
      label: "Groups settings",
      shortLabel: "Settings",
      href: MOBILIZE_ADMIN_SETTINGS_HREF,
    });
  }

  return items;
}

export function isMobilizeChaptersNavActive(key: MobilizeChaptersNavKey, pathname: string): boolean {
  if (key === "chapter") {
    return pathname === MOBILIZE_CHAPTERS_HREF || pathname === MOBILIZE_PREFIX;
  }
  if (key === "groups") {
    return pathname === MOBILIZE_MY_GROUPS_HREF || pathname.startsWith(`${MOBILIZE_MY_GROUPS_HREF}/`);
  }
  if (key === "activities") {
    return pathname.startsWith(`${MOBILIZE_PREFIX}/activities`);
  }
  if (key === "notifications") {
    return pathname.startsWith(`${MOBILIZE_PREFIX}/notifications`);
  }
  if (key === "groupsSettings") {
    return pathname.startsWith(MOBILIZE_ADMIN_SETTINGS_HREF);
  }
  return false;
}

export const MOBILIZE_SOCIAL_HUB_PATH_RES = [
  /^\/dashboard\/mobilize\/home\/?$/,
  /^\/dashboard\/mobilize\/alerts(?:\/|$)/,
  /^\/dashboard\/mobilize\/messages(?:\/|$)/,
  /^\/dashboard\/mobilize\/bookmarks(?:\/|$)/,
  /^\/dashboard\/mobilize\/social-settings(?:\/|$)/,
  /^\/dashboard\/mobilize\/profile\/[^/]+\/?$/,
] as const;

export function isMobilizeSocialHubPath(pathname: string): boolean {
  return MOBILIZE_SOCIAL_HUB_PATH_RES.some((re) => re.test(pathname));
}
