export function buildMissionUpdateSharePath(announcementId: string): string {
  const q = new URLSearchParams({ update: announcementId });
  return `/dashboard/notifications?${q.toString()}`;
}

export function absoluteMissionUpdateShareUrl(origin: string, announcementId: string): string {
  return `${origin.replace(/\/$/, "")}${buildMissionUpdateSharePath(announcementId)}`;
}