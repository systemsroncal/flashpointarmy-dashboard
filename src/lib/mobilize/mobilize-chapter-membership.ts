import type { MobilizeGroupTabSlug } from "@/lib/mobilize/group-detail-tabs";

export type MobilizeChapterBrief = {
  id: string;
  name: string;
};

/** User belongs to or leads this Mobilize chapter (approved membership or owner). */
export function isMobilizeChapterMine(input: {
  membership: { member_role: string; membership_status: string } | null;
  groupCreatedBy?: string | null;
  currentUserId: string;
}): boolean {
  if (input.groupCreatedBy === input.currentUserId) return true;
  if (!input.membership) return false;
  return input.membership.membership_status === "approved";
}

export function mobilizeChapterTabIsActive(
  groupId: string,
  tab: MobilizeGroupTabSlug,
  activeGroupId: string | null,
  activeTab: MobilizeGroupTabSlug
): boolean {
  return activeGroupId === groupId && activeTab === tab;
}
