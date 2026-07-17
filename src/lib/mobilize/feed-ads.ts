import { sanitizeFeedHtml } from "@/lib/mobilize/social/sanitize-feed-html";
import type {
  MobilizeFeedAdBlock,
  MobilizeFeedAdCarouselBlock,
  MobilizeFeedAdCarouselSlide,
  MobilizeFeedAdImageBlock,
  MobilizeFeedAdRichTextBlock,
} from "@/lib/mobilize/feed-ads-types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BLOCKS = 24;
const MAX_CAROUSEL_SLIDES = 12;
const MAX_CLASS_LEN = 200;
const MAX_ID_LEN = 80;
const MAX_TITLE_LEN = 120;

export function isSafeFeedAdHref(href: string): boolean {
  const s = href.trim();
  if (!s) return true;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Image src URL for ad blocks (absolute https, site-relative path, or uploads path). */
export function isSafeFeedAdImageUrl(url: string): boolean {
  const s = url.trim();
  if (!s || s.length > 2000) return false;
  if (/[<>"'`\s]/.test(s)) return false;
  if (s.startsWith("/") && !s.startsWith("//")) return true;
  if (s.startsWith("uploads/")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanOptionalToken(raw: unknown, maxLen: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s || s.length > maxLen) return undefined;
  if (/[<>"'`]/.test(s)) return undefined;
  return s;
}

function parseSlide(raw: unknown, index: number): MobilizeFeedAdCarouselSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const image_url = typeof o.image_url === "string" ? o.image_url.trim() : "";
  if (!image_url || !isSafeFeedAdImageUrl(image_url)) return null;
  const href = typeof o.href === "string" ? o.href.trim() : "";
  if (href && !isSafeFeedAdHref(href)) return null;
  return {
    image_url,
    href,
    className: cleanOptionalToken(o.className, MAX_CLASS_LEN),
    elementId: cleanOptionalToken(o.elementId, MAX_ID_LEN),
  };
}

function parseBlockTitle(raw: Record<string, unknown>): string | undefined {
  return cleanOptionalToken(raw.title, MAX_TITLE_LEN);
}

function parseImageBlock(raw: Record<string, unknown>, id: string, sort_order: number): MobilizeFeedAdImageBlock | null {
  const image_url = typeof raw.image_url === "string" ? raw.image_url.trim() : "";
  if (!image_url || !isSafeFeedAdImageUrl(image_url)) return null;
  const href = typeof raw.href === "string" ? raw.href.trim() : "";
  if (href && !isSafeFeedAdHref(href)) return null;
  return {
    id,
    type: "image",
    sort_order,
    title: parseBlockTitle(raw),
    image_url,
    href,
    className: cleanOptionalToken(raw.className, MAX_CLASS_LEN),
    elementId: cleanOptionalToken(raw.elementId, MAX_ID_LEN),
  };
}

function parseCarouselBlock(
  raw: Record<string, unknown>,
  id: string,
  sort_order: number
): MobilizeFeedAdCarouselBlock | null {
  const slidesRaw = Array.isArray(raw.slides) ? raw.slides : [];
  const slides = slidesRaw
    .map((s, i) => parseSlide(s, i))
    .filter((s): s is MobilizeFeedAdCarouselSlide => s !== null)
    .slice(0, MAX_CAROUSEL_SLIDES);
  if (!slides.length) return null;
  return {
    id,
    type: "carousel",
    sort_order,
    title: parseBlockTitle(raw),
    slides,
    className: cleanOptionalToken(raw.className, MAX_CLASS_LEN),
    elementId: cleanOptionalToken(raw.elementId, MAX_ID_LEN),
  };
}

function parseRichTextBlock(
  raw: Record<string, unknown>,
  id: string,
  sort_order: number
): MobilizeFeedAdRichTextBlock | null {
  const htmlRaw = typeof raw.html === "string" ? raw.html : "";
  const html = sanitizeFeedHtml(htmlRaw);
  if (!html) return null;
  return {
    id,
    type: "rich_text",
    sort_order,
    html,
    className: cleanOptionalToken(raw.className, MAX_CLASS_LEN),
    elementId: cleanOptionalToken(raw.elementId, MAX_ID_LEN),
  };
}

/** Parse and normalize stored JSON into ordered feed ad blocks. */
export function parseMobilizeFeedAds(raw: unknown): MobilizeFeedAdBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: MobilizeFeedAdBlock[] = [];
  for (let i = 0; i < Math.min(raw.length, MAX_BLOCKS); i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `block-${i}`;
    const sort_order = Number.isFinite(Number(o.sort_order)) ? Number(o.sort_order) : i;
    const type = o.type;
    let block: MobilizeFeedAdBlock | null = null;
    if (type === "image") block = parseImageBlock(o, id, sort_order);
    else if (type === "carousel") block = parseCarouselBlock(o, id, sort_order);
    else if (type === "rich_text") block = parseRichTextBlock(o, id, sort_order);
    if (block) blocks.push(block);
  }
  return blocks.sort((a, b) => a.sort_order - b.sort_order);
}

export async function loadMobilizeFeedAds(admin: SupabaseClient): Promise<MobilizeFeedAdBlock[]> {
  const { data } = await admin
    .from("mobilize_policy_settings")
    .select("group_feed_ads")
    .eq("id", 1)
    .maybeSingle();
  return parseMobilizeFeedAds((data as { group_feed_ads?: unknown } | null)?.group_feed_ads);
}

export function serializeMobilizeFeedAds(blocks: MobilizeFeedAdBlock[]): MobilizeFeedAdBlock[] {
  return parseMobilizeFeedAds(blocks);
}
