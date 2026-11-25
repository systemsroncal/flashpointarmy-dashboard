import type { Metadata } from "next";
import {
  APP_DISPLAY_NAME,
  DEFAULT_SHARE_META_IMAGE,
  sharePageTitle,
} from "@/lib/site/app-branding";
import { announcementPlainTextPreview } from "@/components/dashboard/notifications/announcement-video-markers";

export function buildOpenGraphMetadata({
  title,
  description,
  imageUrl,
  canonicalPath,
}: {
  title: string;
  description?: string;
  imageUrl?: string | null;
  canonicalPath?: string;
}): Metadata {
  const pageTitle = sharePageTitle(title);
  const desc =
    description?.trim().slice(0, 200) ||
    `View on ${APP_DISPLAY_NAME}. Sign in to read the full update.`;
  const image = imageUrl?.trim() || DEFAULT_SHARE_META_IMAGE;

  return {
    title: pageTitle,
    description: desc,
    openGraph: {
      title: pageTitle,
      description: desc,
      siteName: APP_DISPLAY_NAME,
      images: [{ url: image }],
      ...(canonicalPath ? { url: canonicalPath } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: desc,
      images: [image],
    },
  };
}

export function descriptionFromAnnouncementHtml(html: string): string {
  return announcementPlainTextPreview(html).slice(0, 200);
}