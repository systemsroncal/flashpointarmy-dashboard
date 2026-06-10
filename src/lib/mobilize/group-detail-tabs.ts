export const MOBILIZE_GROUP_DETAIL_PATH_RE = /^\/dashboard\/mobilize\/groups\/([^/]+)\/?$/;

export const MOBILIZE_GROUP_TAB_SLUGS = ["announcements", "events", "members", "resources"] as const;
export type MobilizeGroupTabSlug = (typeof MOBILIZE_GROUP_TAB_SLUGS)[number];

export const MOBILIZE_GROUP_TAB_LABELS: Record<MobilizeGroupTabSlug, string> = {
  announcements: "Announcements",
  events: "Events",
  members: "Members",
  resources: "Resources",
};

export function parseMobilizeGroupDetailId(pathname: string): string | null {
  const match = pathname.match(MOBILIZE_GROUP_DETAIL_PATH_RE);
  return match?.[1] ?? null;
}

export function parseMobilizeGroupTab(raw: string | null | undefined): MobilizeGroupTabSlug {
  if (raw === "events" || raw === "members" || raw === "resources") return raw;
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
