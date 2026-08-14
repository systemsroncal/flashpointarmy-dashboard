/** Listed groups appear on the Mobilize map and browse list; unlisted groups are URL-only. */
export function isMobilizeGroupListed(visibility: string): boolean {
  return visibility !== "private";
}

export function mobilizeGroupListingVisibilityFromListed(listed: boolean): "public" | "private" {
  return listed ? "public" : "private";
}

export function labelGroupListingVisibility(visibility: string): string {
  return isMobilizeGroupListed(visibility) ? "Listed" : "Unlisted";
}

export type MobilizeGroupPublishStatus = "published" | "draft";

/** Draft groups stay in the dashboard but are hidden from public discovery and /g pages. */
export function isMobilizeGroupPublished(status: string | null | undefined): boolean {
  return status !== "draft";
}

export function normalizeMobilizeGroupPublishStatus(
  value: unknown
): MobilizeGroupPublishStatus {
  return value === "draft" ? "draft" : "published";
}

export function labelGroupPublishStatus(status: string | null | undefined): string {
  return isMobilizeGroupPublished(status) ? "Published" : "Draft";
}

/** Human-readable chip text for Mobilize group settings (not raw enum strings). */
export function labelEventCreatePolicy(policy: string): string {
  return policy === "leader_only"
    ? "New events: leaders only"
    : "New events: any approved member";
}

export function labelWallPostPolicy(policy: string): string {
  return policy === "leaders_only"
    ? "Feed: leaders only"
    : "Feed: all members";
}

export function labelResourcesPostPolicy(policy: string): string {
  return policy === "leaders_only"
    ? "Resources: leaders only"
    : "Resources: all members";
}
