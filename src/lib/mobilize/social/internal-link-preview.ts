import { loadSharePostMeta } from "@/lib/share/load-share-post-meta";
import { descriptionFromAnnouncementHtml } from "@/lib/share/build-share-metadata";
import { extractImageSrcsFromHtml } from "@/lib/share/announcement-media-html";
import type { LinkPreviewMeta } from "@/lib/mobilize/social/link-preview";
import { APP_SHORT_NAME, DEFAULT_SHARE_META_IMAGE } from "@/lib/site/app-branding";
import { getPublicSiteUrl } from "@/lib/auth/public-site-url";
import { createAdminClient } from "@/utils/supabase/admin";

const APP_HOST_SUFFIXES = ["fparmychapters.com"];

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

/** Hosts that belong to this app (production, dev, and the configured site URL). */
export function isAppLinkHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
  if (APP_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    return true;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (!env) return false;
  try {
    return normalizeHost(new URL(env).hostname) === host;
  } catch {
    return false;
  }
}

function absoluteAsset(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  try {
    return new URL(raw, getPublicSiteUrl()).toString();
  } catch {
    return null;
  }
}

function card(
  pageUrl: string,
  title: string,
  description: string | null,
  imageUrl: string | null
): LinkPreviewMeta {
  return {
    url: pageUrl,
    title: title.trim() || APP_SHORT_NAME,
    description: description?.trim() || null,
    imageUrl: absoluteAsset(imageUrl) ?? DEFAULT_SHARE_META_IMAGE,
    siteName: APP_SHORT_NAME,
  };
}

async function previewSharePost(pageUrl: string, params: URLSearchParams): Promise<LinkPreviewMeta | null> {
  const meta = await loadSharePostMeta({
    kind: params.get("kind") ?? undefined,
    post_id: params.get("post_id") ?? undefined,
    group_id: params.get("group_id") ?? undefined,
    user_id: params.get("user_id") ?? undefined,
  });
  if (!meta) return null;
  return card(pageUrl, meta.title, meta.description, meta.imageUrl);
}

async function previewMissionUpdate(pageUrl: string, id: string): Promise<LinkPreviewMeta | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("dashboard_announcements")
    .select("id, title, description")
    .eq("id", id)
    .maybeSingle();
  if (!data?.title) return null;
  const images = extractImageSrcsFromHtml((data.description as string | null) ?? "");
  return card(
    pageUrl,
    data.title as string,
    descriptionFromAnnouncementHtml((data.description as string | null) ?? ""),
    images[0] ?? DEFAULT_SHARE_META_IMAGE
  );
}

async function previewGroup(pageUrl: string, idOrSlug: string): Promise<LinkPreviewMeta | null> {
  const admin = createAdminClient();
  const groupSelect = "id, name, description, cover_image_url, public_slug";
  let { data: group } = await admin.from("mobilize_groups").select(groupSelect).eq("id", idOrSlug).maybeSingle();
  if (!group) {
    const bySlug = await admin
      .from("mobilize_groups")
      .select(groupSelect)
      .eq("public_slug", idOrSlug)
      .maybeSingle();
    group = bySlug.data;
  }
  if (!group?.name) return null;
  const description = typeof group.description === "string" ? group.description.slice(0, 200) : null;
  return card(pageUrl, group.name as string, description, (group.cover_image_url as string | null) ?? null);
}

async function previewProfile(pageUrl: string, userId: string): Promise<LinkPreviewMeta | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, first_name, last_name, avatar_url, bio")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  const display =
    (profile.display_name as string | undefined)?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    "Member";
  const bio = typeof profile.bio === "string" ? profile.bio.slice(0, 200) : null;
  return card(pageUrl, display, bio, (profile.avatar_url as string | null) ?? null);
}

/**
 * Open Graph for this app's own URLs, read from the database.
 * Fetching the public URL from the app server often fails (hairpin / private DNS).
 */
export async function resolveInternalLinkPreview(raw: string): Promise<LinkPreviewMeta | null> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!isAppLinkHost(url.hostname)) return null;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  const pageUrl = url.toString();

  try {
    if (path === "/share/post") {
      return previewSharePost(pageUrl, url.searchParams);
    }

    const mission = path.match(/^\/share\/mission-update\/([^/]+)$/);
    if (mission?.[1]) return previewMissionUpdate(pageUrl, decodeURIComponent(mission[1]));

    const publicGroup = path.match(/^\/g\/([^/]+)$/);
    if (publicGroup?.[1]) return previewGroup(pageUrl, decodeURIComponent(publicGroup[1]));

    const dashGroup = path.match(/^\/dashboard\/mobilize\/groups\/([^/]+)$/);
    if (dashGroup?.[1]) {
      const groupId = decodeURIComponent(dashGroup[1]);
      const sharePost = url.searchParams.get("share_post")?.trim();
      if (sharePost) {
        const params = new URLSearchParams({
          kind: "group_message",
          group_id: groupId,
          post_id: sharePost,
        });
        return (await previewSharePost(pageUrl, params)) ?? previewGroup(pageUrl, groupId);
      }
      return previewGroup(pageUrl, groupId);
    }

    const profile = path.match(/^\/dashboard\/mobilize\/profile\/([^/]+)$/);
    if (profile?.[1]) {
      const userId = decodeURIComponent(profile[1]);
      const sharePost = url.searchParams.get("share_post")?.trim();
      if (sharePost) {
        const params = new URLSearchParams({
          kind: "profile_post",
          user_id: userId,
          post_id: sharePost,
        });
        return (await previewSharePost(pageUrl, params)) ?? previewProfile(pageUrl, userId);
      }
      return previewProfile(pageUrl, userId);
    }
  } catch {
    return null;
  }

  return null;
}
