import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  APP_DISPLAY_NAME,
  DEFAULT_SHARE_META_IMAGE,
  sharePageTitle,
} from "@/lib/site/app-branding";
import { getPublicSiteUrl } from "@/lib/auth/public-site-url";
import { announcementPlainTextPreview } from "@/components/dashboard/notifications/announcement-video-markers";

async function shareRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const rawHost = h.get("x-forwarded-host") ?? h.get("host");
    const host = rawHost?.split(",")[0]?.trim();
    if (host && !host.includes(" ") && !host.includes("/")) {
      const proto =
        h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
        (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* metadata generated outside a request */
  }
  return getPublicSiteUrl();
}

/** Absolute URL crawlers can fetch. Relative uploads become the current site origin. */
export function absoluteShareImage(imageUrl: string | null | undefined, origin: string): string {
  const raw = imageUrl?.trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return DEFAULT_SHARE_META_IMAGE;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = origin.replace(/\/$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}

export async function buildOpenGraphMetadata({
  title,
  description,
  imageUrl,
  canonicalPath,
}: {
  title: string;
  description?: string;
  imageUrl?: string | null;
  canonicalPath?: string;
}): Promise<Metadata> {
  const origin = await shareRequestOrigin();
  const pageTitle = sharePageTitle(title);
  const desc =
    description?.trim().slice(0, 200) ||
    `View on ${APP_DISPLAY_NAME}. Sign in to read the full update.`;
  const image = absoluteShareImage(imageUrl, origin);

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
