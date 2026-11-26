import { extractImageSrcsFromHtml } from "@/lib/share/announcement-media-html";
import { plainTextFromHtml } from "@/lib/mobilize/social/sanitize-feed-html";
import { createAdminClient } from "@/utils/supabase/admin";

export type SharePostMeta = {
  title: string;
  description: string;
  imageUrl: string | null;
  authorId?: string;
  authorName?: string;
};

function cleanShareText(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#xa0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstQueryValue(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export async function loadSharePostMeta(
  sp: Record<string, string | string[] | undefined>
): Promise<SharePostMeta | null> {
  const kind = firstQueryValue(sp.kind);
  const postId = firstQueryValue(sp.post_id)?.trim();
  const groupId = firstQueryValue(sp.group_id)?.trim();
  const userId = firstQueryValue(sp.user_id)?.trim();
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
    const plain = cleanShareText(plainTextFromHtml(html || (row.content as string)));
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
    const plain = cleanShareText(plainTextFromHtml(html || (row.content as string)));
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
