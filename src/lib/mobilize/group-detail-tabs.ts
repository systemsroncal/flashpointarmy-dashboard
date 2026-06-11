export const MOBILIZE_GROUP_DETAIL_PATH_RE = /^\/dashboard\/mobilize\/groups\/([^/]+)\/?$/;

export const MOBILIZE_GROUP_TAB_SLUGS = [
  "announcements",
  "events",
  "members",
  "resources",
  "reports",
] as const;
export type MobilizeGroupTabSlug = (typeof MOBILIZE_GROUP_TAB_SLUGS)[number];

export const MOBILIZE_GROUP_TAB_LABELS: Record<MobilizeGroupTabSlug, string> = {
  announcements: "Announcements",
  events: "Events",
  members: "Members",
  resources: "Resources",
  reports: "Reports",
};

/** Tabs shown to all approved members (Reports is leaders/owners only). */
export const MOBILIZE_GROUP_MEMBER_TAB_SLUGS = MOBILIZE_GROUP_TAB_SLUGS.filter(
  (s) => s !== "reports"
) as Exclude<MobilizeGroupTabSlug, "reports">[];

export function parseMobilizeGroupDetailId(pathname: string): string | null {
  const match = pathname.match(MOBILIZE_GROUP_DETAIL_PATH_RE);
  return match?.[1] ?? null;
}

export function parseMobilizeGroupTab(raw: string | null | undefined): MobilizeGroupTabSlug {
  if (
    raw === "events" ||
    raw === "members" ||
    raw === "resources" ||
    raw === "reports"
  ) {
    return raw;
  }
  return "announcements";
}

export function mobilizeGroupTabIndex(slug: MobilizeGroupTabSlug): number {
  return MOBILIZE_GROUP_TAB_SLUGS.indexOf(slug);
}

export function mobilizeGroupDetailHref(
  groupId: string,
  tab: MobilizeGroupTabSlug = "announcements"
): string {
  return `/dashboard/mobilize/groups/${groupId}?tab=${tab}`;
}

export function mobilizeGroupTabsForNav(canViewReports: boolean): MobilizeGroupTabSlug[] {
  return canViewReports ? [...MOBILIZE_GROUP_TAB_SLUGS] : [...MOBILIZE_GROUP_MEMBER_TAB_SLUGS];
}

export function canViewMobilizeGroupReports(input: {
  isSuperAdmin: boolean;
  groupCreatedBy: string | null | undefined;
  currentUserId: string;
  membership: { member_role: string; membership_status: string } | null;
}): boolean {
  if (input.isSuperAdmin) return true;
  if (!input.membership || input.membership.membership_status !== "approved") return false;
  if (input.groupCreatedBy === input.currentUserId) return true;
  return input.membership.member_role === "leader";
}
