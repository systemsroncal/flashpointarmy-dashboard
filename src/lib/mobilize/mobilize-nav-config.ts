import type { ReactNode } from "react";

export const MOBILIZE_PREFIX = "/dashboard/mobilize";
export const MOBILIZE_CHAPTERS_HREF = `${MOBILIZE_PREFIX}/map`;
export const MOBILIZE_MY_CHAPTERS_HREF = `${MOBILIZE_PREFIX}/my-groups`;

export type MobilizeNavItem = {
  key: "dashboard" | "chapters" | "my-chapters" | "activities" | "notifications" | "settings";
  label: string;
  href: string;
  icon?: ReactNode;
};

/** Max chapter rows under My Chapters before showing View all. */
export const MOBILIZE_MY_CHAPTERS_SIDEBAR_LIMIT = 5;
