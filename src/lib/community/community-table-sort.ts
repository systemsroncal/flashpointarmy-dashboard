import type { CommunityMemberBaseRow } from "@/lib/community/community-members-data";

/** Sort keys accepted by `/api/community/members` (aligned with CommunitySection table). */
export const COMMUNITY_MEMBER_REMOTE_SORT_KEYS = [
  "joined",
  "email",
  "phone",
  "first_name",
  "last_name",
  "display_name",
  "role",
] as const;

export type CommunityMemberRemoteSortKey = (typeof COMMUNITY_MEMBER_REMOTE_SORT_KEYS)[number];

export function parseCommunityMemberRemoteSortKey(raw: string | null | undefined): CommunityMemberRemoteSortKey {
  const s = (raw ?? "").toLowerCase().trim();
  if ((COMMUNITY_MEMBER_REMOTE_SORT_KEYS as readonly string[]).includes(s)) {
    return s as CommunityMemberRemoteSortKey;
  }
  return "joined";
}

export function parseCommunityMemberSortAscending(raw: string | null | undefined): boolean {
  return (raw ?? "").toLowerCase().trim() === "asc";
}

/** PostgREST column on `dashboard_community_members` / `dashboard_users` for `.order()`. */
export function communityMemberSortDbColumn(sort: CommunityMemberRemoteSortKey): string {
  switch (sort) {
    case "joined":
      return "created_at";
    case "email":
      return "email";
    case "phone":
      return "phone";
    case "first_name":
      return "first_name";
    case "last_name":
      return "last_name";
    case "display_name":
      return "display_name";
    case "role":
      return "email";
    default:
      return "created_at";
  }
}

/** Full-list sort for fallback path (no SQL ORDER BY on the view). */
export function sortCommunityMemberBaseRows(
  rows: CommunityMemberBaseRow[],
  sort: CommunityMemberRemoteSortKey,
  ascending: boolean
): CommunityMemberBaseRow[] {
  const dir = ascending ? 1 : -1;
  const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
    dir * String(a ?? "").localeCompare(String(b ?? ""), undefined, { sensitivity: "base" });
  const cmpTime = (a: string | null | undefined, b: string | null | undefined) => {
    const ta = a ? new Date(a).getTime() : 0;
    const tb = b ? new Date(b).getTime() : 0;
    return dir * (ta - tb);
  };
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "joined":
        return cmpTime(a.created_at, b.created_at);
      case "email":
        return cmpStr(a.email, b.email);
      case "phone":
        return cmpStr(a.phone, b.phone);
      case "first_name":
        return cmpStr(a.first_name, b.first_name);
      case "last_name":
        return cmpStr(a.last_name, b.last_name);
      case "display_name":
        return cmpStr(a.display_name, b.display_name);
      case "role":
        return cmpStr(a.email, b.email);
      default:
        return cmpTime(a.created_at, b.created_at);
    }
  });
}
