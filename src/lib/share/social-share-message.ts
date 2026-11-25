import { APP_SHORT_NAME } from "@/lib/site/app-branding";

/** Plain text copied into WhatsApp, Telegram, X, and email body. */
export function buildSocialShareMessage(headline: string, url: string): string {
  const h = headline.trim();
  const u = url.trim();
  if (!h) return u;
  return `${h}\n\n${u}`;
}

export function missionUpdateShareHeadline(title: string): string {
  return `Mission Update: ${title.trim()} — ${APP_SHORT_NAME}`;
}

export function mobilizePostShareHeadline(authorName: string): string {
  const who = authorName.trim() || "Member";
  return `Post from ${who} on ${APP_SHORT_NAME}`;
}