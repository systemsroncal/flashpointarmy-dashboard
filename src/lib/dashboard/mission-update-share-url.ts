/** In-app deep link (after sign-in). */
export function buildMissionUpdateSharePath(announcementId: string): string {
  const q = new URLSearchParams({ update: announcementId });
  return `/dashboard/notifications?${q.toString()}`;
}

/** Public URL for social crawlers (Open Graph) and clipboard share. */
export function buildMissionUpdatePublicSharePath(announcementId: string): string {
  return `/share/mission-update/${announcementId}`;
}

export function absoluteMissionUpdateShareUrl(origin: string, announcementId: string): string {
  return `${origin.replace(/\/$/, "")}${buildMissionUpdatePublicSharePath(announcementId)}`;
}