export function mobilizeMemberProfileHref(userId: string, returnTo?: string | null): string {
  const base = `/dashboard/mobilize/profile/${userId}`;
  const back = safeDashboardReturn(returnTo ?? null);
  if (!back) return base;
  const q = new URLSearchParams({ from: back });
  return `${base}?${q.toString()}`;
}

/** In-app path only. Blocks protocol-relative and external return targets. */
function safeDashboardReturn(from: string | null): string | null {
  if (!from) return null;
  const value = from.trim();
  if (!value.startsWith("/dashboard")) return null;
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) return null;
  return value;
}

/**
 * Where the profile back arrow should go.
 * `null` means the visit was direct (or from the feed) and the header keeps the menu icon.
 */
export function contextualMobilizeProfileBackHref(sp: { get(name: string): string | null }): string | null {
  const from = sp.get("from");
  const groupId = sp.get("groupId");
  if (from === "group" && groupId) {
    return `/dashboard/mobilize/groups/${groupId}?tab=members`;
  }
  if (from === "group") return "/dashboard/mobilize/my-groups";
  return safeDashboardReturn(from);
}

/** Mobile back from `/dashboard/mobilize/profile/:id` — mirrors profile page `searchParams`. */
export function resolveMobilizeProfileBackHref(sp: URLSearchParams): string {
  return contextualMobilizeProfileBackHref(sp) ?? "/dashboard/mobilize/home";
}
