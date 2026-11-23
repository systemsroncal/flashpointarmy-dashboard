import { announcementPlainTextPreview } from "@/components/dashboard/notifications/announcement-video-markers";
import { buildMissionUpdateSharePath } from "@/lib/dashboard/mission-update-share-url";

const PREVIEW_MAX = 320;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function missionUpdateEmailPreviewHtml(description: string): string {
  const plain = announcementPlainTextPreview(description).trim();
  if (!plain) return "";
  const excerpt = plain.length > PREVIEW_MAX ? `${plain.slice(0, PREVIEW_MAX - 1)}…` : plain;
  return `<p>${escapeHtml(excerpt).replace(/\n+/g, "<br/>")}</p>`;
}

export function missionUpdateEmailUrl(siteBase: string, announcementId: string): string {
  const path = buildMissionUpdateSharePath(announcementId);
  return `${siteBase.replace(/\/$/, "")}${path}`;
}