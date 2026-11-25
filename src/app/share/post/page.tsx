import { ShareLinkLanding } from "@/components/share/ShareLinkLanding";
import { buildOpenGraphMetadata, descriptionFromAnnouncementHtml } from "@/lib/share/build-share-metadata";
import { extractImageSrcsFromHtml } from "@/lib/share/announcement-media-html";
import { legacySharePageRedirectPath } from "@/lib/mobilize/social/post-share-url";
import { mobilizePostShareHeadline } from "@/lib/share/social-share-message";
import { APP_DISPLAY_NAME, DEFAULT_SHARE_META_IMAGE } from "@/lib/site/app-branding";
import { plainTextFromHtml } from "@/lib/mobilize/social/sanitize-feed-html";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

async function loadPostMeta(sp: Record<string, string | string[] | undefined>) {
  const kind = firstString(sp.kind);
  const postId = firstString(sp.post_id)?.trim();
  const groupId = firstString(sp.group_id)?.trim();
  const userId = firstString(sp.user_id)?.trim();
  const admin = createAdminClient();

  if (kind === "group_message" && groupId && postId) {
    const { data: row } = await admin
      .from("mobilize_group_messages")
      .select("content, content_html, image_urls, author_id")
      .eq("id", postId)
      .eq("group_id", groupId)
      .maybeSingle();
    if (!row) return null;
    const html = (row.content_html as string | null) ?? "";
    const plain = plainTextFromHtml(html || (row.content as string));
    const imageUrls = (row.image_urls as string[]) ?? [];
    const htmlImages = extractImageSrcsFromHtml(html);
    return {
      title: plain.slice(0, 80) || "Mobilize post",
      description: plain.slice(0, 200),
      imageUrl: imageUrls[0] ?? htmlImages[0] ?? null,
      authorId: row.author_id as string,
    };
  }

  if (kind === "profile_post" && userId && postId) {
    const { data: row } = await admin
      .from("mobilize_profile_posts")
      .select("content, content_html, image_urls, author_id")
      .eq("id", postId)
      .eq("author_id", userId)
      .maybeSingle();
    if (!row) return null;
    const html = (row.content_html as string | null) ?? "";
    const plain = plainTextFromHtml(html || (row.content as string));
    const imageUrls = (row.image_urls as string[]) ?? [];
    const htmlImages = extractImageSrcsFromHtml(html);
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    const display =
      (profile?.display_name as string | undefined)?.trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      "Member";
    return {
      title: plain.slice(0, 80) || `Post from ${display}`,
      description: plain.slice(0, 200),
      imageUrl: imageUrls[0] ?? htmlImages[0] ?? null,
      authorName: display,
    };
  }

  return null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const meta = await loadPostMeta(sp);
  if (!meta) return {};

  return buildOpenGraphMetadata({
    title: meta.title,
    description: meta.description,
    imageUrl: meta.imageUrl,
    canonicalPath: "/share/post",
  });
}

export default async function MobilizePostSharePage({ searchParams }: Props) {
  const sp = await searchParams;
  const meta = await loadPostMeta(sp);
  if (!meta) notFound();

  const redirectTarget = legacySharePageRedirectPath({
    kind: firstString(sp.kind),
    group_id: firstString(sp.group_id),
    user_id: firstString(sp.user_id),
    post_id: firstString(sp.post_id),
  });

  if (!redirectTarget) notFound();

  const authorName = ("authorName" in meta && meta.authorName) || "Member";
  const headline = mobilizePostShareHeadline(authorName);

  return (
    <ShareLinkLanding
      headline={headline}
      subtitle={meta.title}
      body={`Posts on ${APP_DISPLAY_NAME} require sign-in to comment and react.`}
      redirectPath={redirectTarget}
    />
  );
}