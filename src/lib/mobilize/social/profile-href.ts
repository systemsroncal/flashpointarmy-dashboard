export function mobilizeMemberProfileHref(userId: string): string {
  return `/dashboard/mobilize/profile/${userId}`;
}

/** Mobile back from `/dashboard/mobilize/profile/:id` — mirrors profile page `searchParams`. */
export function resolveMobilizeProfileBackHref(sp: URLSearchParams): string {
  const from = sp.get("from");
  const groupId = sp.get("groupId");
  if (from === "group" && groupId) {
    return `/dashboard/mobilize/groups/${groupId}?tab=members`;
  }
  if (from === "group") return "/dashboard/mobilize/my-groups";
  if (from?.startsWith("/")) return from;
  return "/dashboard/mobilize/home";
}
