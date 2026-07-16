import type { ReactNode } from "react";

export const MOBILIZE_PREFIX = "/dashboard/mobilize";
export const MOBILIZE_HOME_HREF = `${MOBILIZE_PREFIX}/home`;
export const MOBILIZE_CHAPTERS_HREF = `${MOBILIZE_PREFIX}/map`;
export const MOBILIZE_MY_CHAPTERS_HREF = `${MOBILIZE_PREFIX}/my-groups`;

export type MobilizeNavItem = {
  key: "dashboard" | "chapters" | "my-chapters" | "activities" | "notifications" | "settings";
  label: string;
  href: string;
  icon?: ReactNode;
};

/** Max group rows under Groups before showing View all. */
export const MOBILIZE_MY_CHAPTERS_SIDEBAR_LIMIT = 5;
export const MOBILIZE_MY_GROUPS_SIDEBAR_LIMIT = MOBILIZE_MY_CHAPTERS_SIDEBAR_LIMIT;
export const MOBILIZE_MY_GROUPS_HREF = MOBILIZE_MY_CHAPTERS_HREF;
export const MOBILIZE_ALERTS_HREF = `${MOBILIZE_PREFIX}/alerts`;
export const MOBILIZE_MESSAGES_HREF = `${MOBILIZE_PREFIX}/messages`;
export const MOBILIZE_BOOKMARKS_HREF = `${MOBILIZE_PREFIX}/bookmarks`;
export const MOBILIZE_SOCIAL_SETTINGS_HREF = `${MOBILIZE_PREFIX}/social-settings`;
export const MOBILIZE_ADMIN_SETTINGS_HREF = `${MOBILIZE_PREFIX}/settings`;
