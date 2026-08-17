export type MobilizeEnrollmentMode =
  | "request_to_join"
  | "open_signup"
  | "closed"
  | "auto_closed";

export const MOBILIZE_ENROLLMENT_MODES: MobilizeEnrollmentMode[] = [
  "request_to_join",
  "open_signup",
  "closed",
  "auto_closed",
];

export function enrollmentModeLabel(mode: string | null | undefined): string {
  switch (mode) {
    case "open_signup":
      return "Open signup";
    case "closed":
      return "Closed";
    case "auto_closed":
      return "Auto-closed";
    case "request_to_join":
    default:
      return "Request to join";
  }
}

export function enrollmentAcceptsNewMembers(mode: string | null | undefined): boolean {
  return mode === "open_signup" || mode === "request_to_join" || !mode;
}

export function enrollmentAutoApproves(mode: string | null | undefined): boolean {
  return mode === "open_signup";
}

/** Listed/public groups always auto-join; closed groups never do. */
export function groupJoinAutoApproves(group: {
  enrollment_mode?: string | null;
  visibility?: string | null;
}): boolean {
  const mode = String(group.enrollment_mode ?? "request_to_join");
  if (mode === "closed" || mode === "auto_closed") return false;
  if (mode === "open_signup") return true;
  return Boolean(group.visibility) && group.visibility !== "private";
}

/** Listed/public + request-to-join is a contradictory pair — treat as open signup. */
export function syncEnrollmentWithListedVisibility(
  visibility: string,
  enrollmentMode: string
): string {
  if (visibility !== "private" && enrollmentMode === "request_to_join") {
    return "open_signup";
  }
  return enrollmentMode;
}

export type MobilizeSubgroupBrief = {
  id: string;
  name: string;
  cover_image_url: string | null;
  enrollment_mode: string;
};

/** Chapters = top-level; Groups = subgroups under a chapter. */
export function isMobilizeChapter(row: { parent_group_id?: string | null }): boolean {
  return row.parent_group_id == null;
}
