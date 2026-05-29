/** Human-readable chip text for Mobilize group settings (not raw enum strings). */
export function labelEventCreatePolicy(policy: string): string {
  return policy === "leader_only"
    ? "New events: leaders only"
    : "New events: any approved member";
}

export function labelWallPostPolicy(policy: string): string {
  return policy === "leaders_only"
    ? "Announcements: leaders only"
    : "Announcements: all members";
}
