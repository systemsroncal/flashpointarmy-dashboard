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
